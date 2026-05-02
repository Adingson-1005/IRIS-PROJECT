from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from services.ai_checker import check_research
from services.storage import upload_file
from jose import jwt
import os
import shutil
import uuid

router = APIRouter()

DRAFT_FOLDER = "uploads/drafts"
os.makedirs(DRAFT_FOLDER, exist_ok=True)

SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
ALGORITHM = "HS256"

def get_user_id(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/submit-draft")
async def submit_draft(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_user_id)
):
    try:
        template = db.execute(text("""
            SELECT id, file_url FROM templates
            ORDER BY created_at DESC LIMIT 1
        """)).fetchone()

        if not template:
            raise HTTPException(
                status_code=404,
                detail="No template has been uploaded yet. Please ask your instructor to upload a research template first."
            )

        file_bytes = await file.file.read()
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        draft_path = upload_file(file_bytes, filename, "drafts")

        result = check_research(draft_path, template.file_url)

        db.execute(text("""
            INSERT INTO student_submissions
            (student_id, template_id, file_url, title, score, feedback, status)
            VALUES (:student_id, :template_id, :file_url, :title, :score, :feedback, 'completed')
        """), {
            "student_id": user_id,
            "template_id": str(template.id),
            "file_url": draft_path,
            "title": title,
            "score": result["score"],
            "feedback": result["feedback"]
        })
        db.commit()

        return {
            "title": title,
            "score": result["score"],
            "feedback": result["feedback"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))