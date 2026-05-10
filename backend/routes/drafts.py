from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from services.storage import upload_file
from jose import jwt
import os
import uuid
import re

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
ALGORITHM = "HS256"

def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "id": payload.get("sub"),
            "role": payload.get("role")
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Student: upload a draft ──
@router.post("/upload")
async def upload_draft(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        student_id = payload.get("sub")

        allowed = ['.pdf', '.docx', '.doc']
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files allowed")

        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="File is empty")

        file_id = str(uuid.uuid4())
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", file.filename)
        safe_name = re.sub(r"_+", "_", safe_name)
        filename = f"{file_id}_{safe_name}"

        content_type = "application/pdf" if ext == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        file_url = upload_file(file_bytes, filename, "student_drafts")

        db.execute(text("""
            INSERT INTO student_drafts (student_id, title, file_url, file_type)
            VALUES (:student_id, :title, :file_url, :file_type)
        """), {
            "student_id": student_id,
            "title": title,
            "file_url": file_url,
            "file_type": ext.replace(".", "").upper()
        })
        db.commit()

        return {"message": "Draft uploaded successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Student: get my drafts ──
@router.get("/my-drafts")
def get_my_drafts(
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        student_id = payload.get("sub")

        drafts = db.execute(text("""
            SELECT d.id, d.title, d.file_url, d.file_type, d.created_at
            FROM student_drafts d
            WHERE d.student_id = :student_id
            ORDER BY d.created_at DESC
        """), {"student_id": student_id}).fetchall()

        result = []
        for draft in drafts:
            comments = db.execute(text("""
                SELECT c.id, c.comment, c.created_at,
                       u.full_name as instructor_name
                FROM draft_comments c
                JOIN users u ON c.instructor_id = u.id
                WHERE c.draft_id = :draft_id
                ORDER BY c.created_at ASC
            """), {"draft_id": str(draft.id)}).fetchall()

            result.append({
                **dict(draft._mapping),
                "comments": [dict(c._mapping) for c in comments]
            })

        return {"drafts": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Student: delete a draft ──
@router.delete("/delete/{draft_id}")
def delete_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        student_id = payload.get("sub")

        draft = db.execute(text("""
            SELECT id, student_id FROM student_drafts WHERE id = :id
        """), {"id": draft_id}).fetchone()

        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        if str(draft.student_id) != str(student_id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this draft")

        db.execute(text("DELETE FROM draft_comments WHERE draft_id = :id"), {"id": draft_id})
        db.execute(text("DELETE FROM student_drafts WHERE id = :id"), {"id": draft_id})
        db.commit()

        return {"message": "Draft deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor/Admin: get all students with drafts ──
@router.get("/all-students")
def get_all_students_with_drafts(
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        students = db.execute(text("""
            SELECT DISTINCT u.id, u.full_name, u.email,
                   COUNT(d.id) as draft_count,
                   MAX(d.created_at) as last_submitted
            FROM users u
            JOIN student_drafts d ON d.student_id = u.id
            WHERE u.role = 'student'
            GROUP BY u.id, u.full_name, u.email
            ORDER BY last_submitted DESC
        """)).fetchall()

        return {"students": [dict(s._mapping) for s in students]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor/Admin: get drafts of a specific student ──
@router.get("/student/{student_id}")
def get_student_drafts(
    student_id: str,
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        student = db.execute(text("""
            SELECT id, full_name, email FROM users WHERE id = :id
        """), {"id": student_id}).fetchone()

        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        drafts = db.execute(text("""
            SELECT id, title, file_url, file_type, created_at
            FROM student_drafts
            WHERE student_id = :student_id
            ORDER BY created_at DESC
        """), {"student_id": student_id}).fetchall()

        result = []
        for draft in drafts:
            comments = db.execute(text("""
                SELECT c.id, c.comment, c.created_at,
                       u.full_name as instructor_name,
                       u.role as instructor_role
                FROM draft_comments c
                JOIN users u ON c.instructor_id = u.id
                WHERE c.draft_id = :draft_id
                ORDER BY c.created_at ASC
            """), {"draft_id": str(draft.id)}).fetchall()

            result.append({
                **dict(draft._mapping),
                "comments": [dict(c._mapping) for c in comments]
            })

        return {
            "student": dict(student._mapping),
            "drafts": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor: add comment on a draft ──
@router.post("/comment/{draft_id}")
def add_comment(
    draft_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        instructor_id = jwt_payload.get("sub")
        role = jwt_payload.get("role")

        if role not in ["instructor", "admin"]:
            raise HTTPException(status_code=403, detail="Only instructors can comment")

        comment_text = payload.get("comment", "").strip()
        if not comment_text:
            raise HTTPException(status_code=400, detail="Comment cannot be empty")

        db.execute(text("""
            INSERT INTO draft_comments (draft_id, instructor_id, comment)
            VALUES (:draft_id, :instructor_id, :comment)
        """), {
            "draft_id": draft_id,
            "instructor_id": instructor_id,
            "comment": comment_text
        })
        db.commit()

        return {"message": "Comment added successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor: delete a comment ──
@router.delete("/comment/{comment_id}")
def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        token = authorization.replace("Bearer ", "")
        jwt_payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        instructor_id = jwt_payload.get("sub")

        comment = db.execute(text("""
            SELECT id, instructor_id FROM draft_comments WHERE id = :id
        """), {"id": comment_id}).fetchone()

        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        if str(comment.instructor_id) != str(instructor_id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

        db.execute(text("DELETE FROM draft_comments WHERE id = :id"), {"id": comment_id})
        db.commit()

        return {"message": "Comment deleted"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))