from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Header, BackgroundTasks, Body
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from services.inverted_index import build_index
from services.storage import upload_file, delete_file
from jose import jwt
import os
import uuid
import re

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
ALGORITHM = "HS256"


def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": payload.get("sub"), "role": payload.get("role")}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def run_build_index(paper_id: str, file_path: str):
    from database import SessionLocal
    db = SessionLocal()
    try:
        build_index(paper_id, file_path, db)
    except Exception as e:
        print(f"Background index build failed for {paper_id}: {e}")
    finally:
        db.close()


@router.post("/upload")
async def upload_paper(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    authors: str = Form(...),
    abstract: str = Form(...),
    category: str = Form(...),
    methodology: str = Form(...),
    year: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] != "instructor":
            raise HTTPException(status_code=403, detail="Instructor only")
        user_id = user["id"]

        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files allowed")

        file_bytes = await file.read()

        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="File is empty")

        file_id = str(uuid.uuid4())
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", file.filename)
        safe_name = re.sub(r"_+", "_", safe_name)
        filename = f"{file_id}_{safe_name}"

        try:
            file_path = upload_file(file_bytes, filename, "papers")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

        if not file_path or not file_path.startswith("http"):
            raise HTTPException(status_code=500, detail="File upload to storage failed")

        try:
            result = db.execute(text("""
                INSERT INTO papers (title, authors, abstract, category, methodology, year, file_url, uploaded_by)
                VALUES (:title, :authors, :abstract, :category, :methodology, :year, :file_url, :uploaded_by)
                RETURNING id
            """), {
                "title": title,
                "authors": authors,
                "abstract": abstract,
                "category": category,
                "methodology": methodology,
                "year": year,
                "file_url": file_path,
                "uploaded_by": user_id
            })
            db.commit()
            paper_id = str(result.fetchone()[0])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database save failed: {str(e)}")

        # Run indexing in background — does not block other requests
        background_tasks.add_task(run_build_index, paper_id, file_path)

        return {"message": "Paper uploaded and indexed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
def list_papers(db: Session = Depends(get_db)):
    try:
        papers = db.execute(text("""
            SELECT id, title, authors, abstract, category, methodology, class_name,
                   year, file_url, created_at,
                   COALESCE(downloads, 0) as downloads
            FROM papers
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
        """)).fetchall()
        return {"papers": [dict(row._mapping) for row in papers]}
    except Exception as e:
        return {"error": str(e)}


@router.get("/my-papers")
def my_papers(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        papers = db.execute(text("""
            SELECT id, title, authors, abstract, category, methodology, class_name,
                   year, file_url, created_at,
                   COALESCE(downloads, 0) as downloads
            FROM papers
            WHERE uploaded_by = :user_id AND deleted_at IS NULL
            ORDER BY created_at DESC
        """), {"user_id": user["id"]}).fetchall()

        return {"papers": [dict(row._mapping) for row in papers]}
    except Exception as e:
        return {"error": str(e)}


@router.get("/archived")
def list_archived_papers(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin only")

        papers = db.execute(text("""
            SELECT id, title, authors, abstract, category, methodology, class_name,
                   year, file_url, created_at, deleted_at,
                   COALESCE(downloads, 0) as downloads
            FROM papers
            WHERE deleted_at IS NOT NULL
            ORDER BY deleted_at DESC
        """)).fetchall()
        return {"papers": [dict(row._mapping) for row in papers]}
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}


@router.patch("/{paper_id}/class")
def update_paper_class(
    paper_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    class_name = payload.get("class_name")
    if class_name == "":
        class_name = None
    if class_name not in (None, "Class A", "Class B", "Class C", "Class D"):
        raise HTTPException(status_code=400, detail="Invalid class")

    try:
        result = db.execute(text("""
            UPDATE papers
            SET class_name = :class_name
            WHERE id = :paper_id
            RETURNING id
        """), {"class_name": class_name, "paper_id": paper_id}).fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Paper not found")
        db.commit()
        return {"message": "Paper class updated", "class_name": class_name}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reindex-all")
def reindex_all(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] not in ["instructor", "admin"]:
            raise HTTPException(status_code=403, detail="Instructor or admin only")

        papers = db.execute(text("SELECT id, file_url FROM papers WHERE deleted_at IS NULL")).fetchall()
        paper_list = [(str(p.id), p.file_url) for p in papers]

        def reindex_all_background():
            from database import SessionLocal
            bg_db = SessionLocal()
            try:
                count = 0
                for paper_id, file_url in paper_list:
                    build_index(paper_id, file_url, bg_db)
                    count += 1
                print(f"Reindexed {count} papers in background")
            except Exception as e:
                print(f"Reindex error: {e}")
            finally:
                bg_db.close()

        background_tasks.add_task(reindex_all_background)
        return {"message": f"Reindexing {len(paper_list)} papers in background"}
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}


@router.delete("/delete/{paper_id}")
def delete_paper(
    paper_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Archives the paper instead of permanently deleting it. The file and
    search index entries are kept intact so the paper can be fully restored
    later from the Archived view."""
    try:
        paper = db.execute(
            text("SELECT id, uploaded_by, deleted_at FROM papers WHERE id = :paper_id"),
            {"paper_id": paper_id}
        ).fetchone()

        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")

        if paper.deleted_at is not None:
            raise HTTPException(status_code=400, detail="Paper is already archived")

        is_owner = str(paper.uploaded_by) == str(user["id"])
        if user["role"] != "admin" and not (user["role"] == "instructor" and is_owner):
            raise HTTPException(status_code=403, detail="You do not have permission to archive this paper")

        db.execute(
            text("UPDATE papers SET deleted_at = NOW() WHERE id = :paper_id"),
            {"paper_id": paper_id}
        )
        db.commit()

        return {"message": "Paper archived successfully"}
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}


@router.delete("/permanent-delete/{paper_id}")
def permanently_delete_paper(
    paper_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    try:
        paper = db.execute(
            text("SELECT id, file_url, deleted_at FROM papers WHERE id = :paper_id"),
            {"paper_id": paper_id}
        ).fetchone()

        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        if paper.deleted_at is None:
            raise HTTPException(status_code=400, detail="Only archived papers can be permanently deleted")

        db.execute(
            text("DELETE FROM inverted_index WHERE paper_id = :paper_id"),
            {"paper_id": paper_id}
        )
        db.execute(
            text("DELETE FROM papers WHERE id = :paper_id"),
            {"paper_id": paper_id}
        )
        db.commit()

        storage_deleted = delete_file(paper.file_url)
        return {
            "message": "Paper permanently deleted",
            "storage_deleted": storage_deleted
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restore/{paper_id}")
def restore_paper(
    paper_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        paper = db.execute(
            text("SELECT id, uploaded_by, deleted_at FROM papers WHERE id = :paper_id"),
            {"paper_id": paper_id}
        ).fetchone()

        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")

        if paper.deleted_at is None:
            raise HTTPException(status_code=400, detail="Paper is not archived")

        is_owner = str(paper.uploaded_by) == str(user["id"])
        if user["role"] != "admin" and not (user["role"] == "instructor" and is_owner):
            raise HTTPException(status_code=403, detail="You do not have permission to restore this paper")

        db.execute(
            text("UPDATE papers SET deleted_at = NULL WHERE id = :paper_id"),
            {"paper_id": paper_id}
        )
        db.commit()

        return {"message": "Paper restored successfully"}
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}


@router.get("/download/{paper_id}")
def download_paper(paper_id: str, db: Session = Depends(get_db)):
    try:
        paper = db.execute(
            text("SELECT * FROM papers WHERE id = :id"),
            {"id": paper_id}
        ).fetchone()

        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")

        if paper.deleted_at is not None:
            raise HTTPException(status_code=404, detail="This paper has been archived and is no longer available")

        db.execute(
            text("UPDATE papers SET downloads = COALESCE(downloads, 0) + 1 WHERE id = :id"),
            {"id": paper_id}
        )
        db.execute(text("""
            INSERT INTO search_logs (keyword, results_count)
            VALUES (:keyword, :count)
        """), {
            "keyword": f"DOWNLOAD: {paper.title}",
            "count": 1
        })
        db.commit()

        return {"download_url": paper.file_url}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}


@router.post("/check-similar")
async def check_similar(payload: dict = Body(...), db: Session = Depends(get_db)):
    try:
        title = (payload or {}).get("title", "").strip()
        abstract = (payload or {}).get("abstract", "").strip()

        if not title and not abstract:
            return {"similar_papers": []}

        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
            'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were',
            'be', 'been', 'have', 'has', 'do', 'does', 'did', 'this', 'that',
            'it', 'as', 'using', 'based', 'study', 'research', 'system'
        }

        combined_text = f"{title} {abstract}".lower()
        words = re.sub(r'[^a-zA-Z0-9\s]', '', combined_text).split()
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        keywords = list(set(keywords))[:15]

        if not keywords:
            return {"similar_papers": []}

        paper_scores = {}
        paper_info = {}

        for keyword in keywords:
            results = db.execute(text("""
                SELECT ii.paper_id, ii.frequency, p.title, p.authors, p.category, p.year
                FROM inverted_index ii
                JOIN papers p ON ii.paper_id = p.id
                WHERE ii.term = :term AND p.deleted_at IS NULL
            """), {"term": keyword}).fetchall()

            for row in results:
                pid = str(row.paper_id)
                paper_scores[pid] = paper_scores.get(pid, 0) + row.frequency
                paper_info[pid] = {
                    "title": row.title,
                    "authors": row.authors,
                    "category": row.category,
                    "year": row.year
                }

        if not paper_scores:
            return {"similar_papers": []}

        max_score = max(paper_scores.values()) if paper_scores else 1
        sorted_papers = sorted(paper_scores.items(), key=lambda x: x[1], reverse=True)
        top_papers = sorted_papers[:3]

        similar = []
        for pid, score in top_papers:
            similarity_pct = min(round((score / max_score) * 100), 99)
            if similarity_pct >= 30:
                similar.append({
                    "paper_id": pid,
                    "similarity": similarity_pct,
                    **paper_info[pid]
                })

        return {"similar_papers": similar}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))