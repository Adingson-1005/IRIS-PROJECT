from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Header, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from services.inverted_index import build_index
from services.storage import upload_file
import os
import uuid
import re

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


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
    authorization: str = Header(...)
):
    try:
        from jose import jwt
        SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")

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
            SELECT id, title, authors, abstract, category, methodology,
                   year, file_url, created_at,
                   COALESCE(downloads, 0) as downloads
            FROM papers
            ORDER BY created_at DESC
        """)).fetchall()
        return {"papers": [dict(row._mapping) for row in papers]}
    except Exception as e:
        return {"error": str(e)}


@router.get("/my-papers")
def my_papers(
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        from jose import jwt
        SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")

        papers = db.execute(text("""
            SELECT id, title, authors, abstract, category, methodology,
                   year, file_url, created_at,
                   COALESCE(downloads, 0) as downloads
            FROM papers
            WHERE uploaded_by = :user_id
            ORDER BY created_at DESC
        """), {"user_id": user_id}).fetchall()

        return {"papers": [dict(row._mapping) for row in papers]}
    except Exception as e:
        return {"error": str(e)}


@router.post("/reindex-all")
def reindex_all(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        papers = db.execute(text("SELECT id, file_url FROM papers")).fetchall()
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
    except Exception as e:
        return {"error": str(e)}


@router.delete("/delete/{paper_id}")
def delete_paper(paper_id: str, db: Session = Depends(get_db)):
    try:
        db.execute(
            text("DELETE FROM inverted_index WHERE paper_id = :paper_id"),
            {"paper_id": paper_id}
        )
        db.execute(
            text("DELETE FROM papers WHERE id = :paper_id"),
            {"paper_id": paper_id}
        )
        db.commit()
        return {"message": "Paper deleted successfully"}
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