from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from services.inverted_index import build_index
from services.storage import upload_file
import os
import shutil
import uuid
from fastapi.responses import FileResponse
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Header

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post("/upload")
async def upload_paper(
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
        filename = f"{file_id}_{file.filename}"

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

        try:
            build_index(paper_id, file_path, db)
        except Exception as e:
            print(f"Index build failed for {paper_id}: {e}")

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
def reindex_all(db: Session = Depends(get_db)):
    try:
        papers = db.execute(text("""
            SELECT id, file_url FROM papers
        """)).fetchall()

        count = 0
        for paper in papers:
            build_index(str(paper.id), paper.file_url, db)
            count += 1

        return {"message": f"Successfully reindexed {count} papers"}
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