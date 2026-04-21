from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from jose import jwt
import os
import shutil
import uuid

router = APIRouter()

TEMPLATE_FOLDER = "uploads/templates"
os.makedirs(TEMPLATE_FOLDER, exist_ok=True)

SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
ALGORITHM = "HS256"

def get_current_user_id(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/upload")
def upload_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files allowed")

        existing = db.execute(text("""
            SELECT id, uploaded_by FROM templates
            ORDER BY created_at DESC LIMIT 1
        """)).fetchone()

        if existing and str(existing.uploaded_by) != str(user_id):
            raise HTTPException(
                status_code=403,
                detail="A template already exists uploaded by another instructor. Only they can replace it."
            )

        if existing:
            db.execute(text("DELETE FROM templates"))
            db.commit()

        file_id = str(uuid.uuid4())
        file_path = f"{TEMPLATE_FOLDER}/{file_id}_{file.filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        db.execute(text("""
            INSERT INTO templates (file_url, uploaded_by)
            VALUES (:file_url, :uploaded_by)
        """), {"file_url": file_path, "uploaded_by": user_id})
        db.commit()

        return {"message": "Template uploaded successfully"}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}

@router.get("/current")
def get_current_template(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    try:
        template = db.execute(text("""
            SELECT t.id, t.file_url, t.created_at,
                   u.full_name as uploaded_by_name,
                   t.uploaded_by
            FROM templates t
            LEFT JOIN users u ON t.uploaded_by = u.id
            ORDER BY t.created_at DESC
            LIMIT 1
        """)).fetchone()

        if not template:
            return {"template": None, "is_owner": False}

        is_owner = str(template.uploaded_by) == str(user_id)

        return {
            "template": dict(template._mapping),
            "is_owner": is_owner
        }
    except Exception as e:
        return {"error": str(e)}