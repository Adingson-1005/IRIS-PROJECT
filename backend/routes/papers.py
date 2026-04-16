from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from services.inverted_index import build_index
import os
import shutil
import uuid
from fastapi.responses import FileResponse

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post("/upload")
def upload_paper(
    title: str = Form(...),
    authors: str = Form(...),
    abstract: str = Form(...),
    category: str = Form(...),
    methodology: str = Form(...),
    year: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files allowed")

        file_id = str(uuid.uuid4())
        file_path = f"{UPLOAD_FOLDER}/{file_id}_{file.filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = db.execute(text("""
            INSERT INTO papers (title, authors, abstract, category, methodology, year, file_url)
            VALUES (:title, :authors, :abstract, :category, :methodology, :year, :file_url)
            RETURNING id
        """), {
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "category": category,
            "methodology": methodology,
            "year": year,
            "file_url": file_path
        })
        db.commit()

        paper_id = str(result.fetchone()[0])
        build_index(paper_id, file_path, db)

        return {"message": "Paper uploaded and indexed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}

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

        file_path = paper.file_url

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on server")

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

        return FileResponse(
            path=file_path,
            filename=f"{paper.title}.pdf",
            media_type="application/pdf"
        )

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}