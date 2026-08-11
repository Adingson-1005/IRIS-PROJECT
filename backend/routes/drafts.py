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
        return {"id": payload.get("sub"), "role": payload.get("role")}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Student: upload a draft ──
@router.post("/upload")
async def upload_draft(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        student = db.execute(text("""
            SELECT class_name FROM users WHERE id = :id
        """), {"id": user["id"]}).fetchone()

        if not student or not student.class_name:
            raise HTTPException(
                status_code=400,
                detail="Please select your class before uploading a draft"
            )

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
        file_url = upload_file(file_bytes, filename, "student_drafts")

        db.execute(text("""
            INSERT INTO student_drafts (student_id, title, file_url, file_type)
            VALUES (:student_id, :title, :file_url, :file_type)
        """), {
            "student_id": user["id"],
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
    user: dict = Depends(get_current_user)
):
    try:
        drafts = db.execute(text("""
            SELECT id, title, file_url, file_type, created_at
            FROM student_drafts
            WHERE student_id = :student_id
            ORDER BY created_at DESC
        """), {"student_id": user["id"]}).fetchall()

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
    user: dict = Depends(get_current_user)
):
    try:
        draft = db.execute(text("""
            SELECT id, student_id FROM student_drafts WHERE id = :id
        """), {"id": draft_id}).fetchone()

        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        if str(draft.student_id) != str(user["id"]):
            raise HTTPException(status_code=403, detail="Not authorized")

        db.execute(text("DELETE FROM draft_comments WHERE draft_id = :id"), {"id": draft_id})
        db.execute(text("DELETE FROM student_drafts WHERE id = :id"), {"id": draft_id})
        db.commit()

        return {"message": "Draft deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor: get students from their assigned class only ──
@router.get("/all-students")
def get_all_students_with_drafts(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] == "admin":
            students = db.execute(text("""
                SELECT DISTINCT u.id, u.full_name, u.email, u.class_name,
                       COUNT(d.id) as draft_count,
                       MAX(d.created_at) as last_submitted
                FROM users u
                JOIN student_drafts d ON d.student_id = u.id
                WHERE u.role = 'student'
                GROUP BY u.id, u.full_name, u.email, u.class_name
                ORDER BY u.class_name ASC, u.full_name ASC
            """)).fetchall()
        else:
            assigned_class = db.execute(text("""
                SELECT name FROM classes WHERE instructor_id = :instructor_id
            """), {"instructor_id": user["id"]}).fetchone()

            if not assigned_class:
                students = db.execute(text("""
                    SELECT DISTINCT u.id, u.full_name, u.email, u.class_name,
                           COUNT(d.id) as draft_count,
                           MAX(d.created_at) as last_submitted
                    FROM users u
                    JOIN student_drafts d ON d.student_id = u.id
                    WHERE u.role = 'student'
                    GROUP BY u.id, u.full_name, u.email, u.class_name
                    ORDER BY u.class_name ASC, u.full_name ASC
                """)).fetchall()
            else:
                students = db.execute(text("""
                    SELECT DISTINCT u.id, u.full_name, u.email, u.class_name,
                           COUNT(d.id) as draft_count,
                           MAX(d.created_at) as last_submitted
                    FROM users u
                    JOIN student_drafts d ON d.student_id = u.id
                    WHERE u.role = 'student'
                    AND u.class_name = :class_name
                    GROUP BY u.id, u.full_name, u.email, u.class_name
                    ORDER BY u.full_name ASC
                """), {"class_name": assigned_class.name}).fetchall()

        return {"students": [dict(s._mapping) for s in students]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor/Admin: get drafts of a specific student ──
@router.get("/student/{student_id}")
def get_student_drafts(
    student_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        student = db.execute(text("""
            SELECT id, full_name, email, class_name FROM users WHERE id = :id
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


# ── Instructor: add comment — only if assigned to student's class ──
@router.post("/comment/{draft_id}")
def add_comment(
    draft_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] == "admin":
            raise HTTPException(status_code=403, detail="Admins cannot comment")

        if user["role"] != "instructor":
            raise HTTPException(status_code=403, detail="Only instructors can comment")

        draft = db.execute(text("""
            SELECT sd.id, u.class_name
            FROM student_drafts sd
            JOIN users u ON sd.student_id = u.id
            WHERE sd.id = :draft_id
        """), {"draft_id": draft_id}).fetchone()

        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        assigned_class = db.execute(text("""
            SELECT name FROM classes WHERE instructor_id = :instructor_id
        """), {"instructor_id": user["id"]}).fetchone()

        if not assigned_class:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to any class"
            )

        if draft.class_name != assigned_class.name:
            raise HTTPException(
                status_code=403,
                detail="You can only comment on drafts from your assigned class"
            )

        comment_text = payload.get("comment", "").strip()
        if not comment_text:
            raise HTTPException(status_code=400, detail="Comment cannot be empty")

        db.execute(text("""
            INSERT INTO draft_comments (draft_id, instructor_id, comment)
            VALUES (:draft_id, :instructor_id, :comment)
        """), {
            "draft_id": draft_id,
            "instructor_id": user["id"],
            "comment": comment_text
        })
        db.commit()

        return {"message": "Comment added successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor: delete own comment ──
@router.delete("/comment/{comment_id}")
def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        comment = db.execute(text("""
            SELECT id, instructor_id FROM draft_comments WHERE id = :id
        """), {"id": comment_id}).fetchone()

        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        if str(comment.instructor_id) != str(user["id"]):
            raise HTTPException(status_code=403, detail="Not authorized")

        db.execute(text("DELETE FROM draft_comments WHERE id = :id"), {"id": comment_id})
        db.commit()

        return {"message": "Comment deleted"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

        # ── Instructor: update draft status ──
@router.put("/status/{draft_id}")
def update_draft_status(
    draft_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] not in ["instructor", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        status = payload.get("status", "").strip()
        valid_statuses = ["Submitted", "Under Review", "Returned for Revision", "Revised", "Approved"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")

        db.execute(text("""
            UPDATE student_drafts SET status = :status WHERE id = :draft_id
        """), {"status": status, "draft_id": draft_id})
        db.commit()

        return {"message": "Status updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ── Student: request publication ──
@router.post("/publish-request")
def request_publication(
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] != "student":
            raise HTTPException(status_code=403, detail="Students only")

        draft_id = payload.get("draft_id")
        title = payload.get("title", "").strip()
        authors = payload.get("authors", "").strip()
        abstract = payload.get("abstract", "").strip()
        category = payload.get("category", "").strip()
        methodology = payload.get("methodology", "").strip()
        year = payload.get("year")

        if not draft_id or not title or not authors:
            raise HTTPException(status_code=400, detail="Draft ID, title and authors are required")

        # Check draft is approved
        draft = db.execute(text("""
            SELECT id, status, student_id FROM student_drafts WHERE id = :id
        """), {"id": draft_id}).fetchone()

        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")

        if str(draft.student_id) != str(user["id"]):
            raise HTTPException(status_code=403, detail="Not your draft")

        if draft.status != "Approved":
            raise HTTPException(
                status_code=400,
                detail="Only approved drafts can be requested for publication"
            )

        # Check if already requested
        existing = db.execute(text("""
            SELECT id, status FROM publication_requests
            WHERE draft_id = :draft_id
        """), {"draft_id": draft_id}).fetchone()

        if existing:
            if existing.status == "Pending":
                raise HTTPException(status_code=400, detail="Publication request already pending")
            if existing.status == "Approved":
                raise HTTPException(status_code=400, detail="This draft is already published")

        db.execute(text("""
            INSERT INTO publication_requests
            (draft_id, student_id, title, authors, abstract, category, methodology, year)
            VALUES (:draft_id, :student_id, :title, :authors, :abstract, :category, :methodology, :year)
        """), {
            "draft_id": draft_id,
            "student_id": user["id"],
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "category": category,
            "methodology": methodology,
            "year": year
        })
        db.commit()

        return {"message": "Publication request submitted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Student: get my publication requests ──
@router.get("/my-publish-requests")
def get_my_publish_requests(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        requests = db.execute(text("""
            SELECT pr.id, pr.draft_id, pr.title, pr.status,
                   pr.rejection_reason, pr.created_at
            FROM publication_requests pr
            WHERE pr.student_id = :student_id
            ORDER BY pr.created_at DESC
        """), {"student_id": user["id"]}).fetchall()

        return {"requests": [dict(r._mapping) for r in requests]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor/Admin: get all pending publication requests ──
@router.get("/publish-requests")
def get_publish_requests(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] not in ["instructor", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        requests = db.execute(text("""
            SELECT pr.id, pr.draft_id, pr.title, pr.authors,
                   pr.abstract, pr.category, pr.methodology, pr.year,
                   pr.status, pr.rejection_reason, pr.created_at,
                   u.full_name as student_name, u.class_name
            FROM publication_requests pr
            JOIN users u ON pr.student_id = u.id
            ORDER BY pr.created_at DESC
        """)).fetchall()

        return {"requests": [dict(r._mapping) for r in requests]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor: approve publication request ──
@router.post("/publish-approve/{request_id}")
def approve_publication(
    request_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] not in ["instructor", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        req = db.execute(text("""
            SELECT * FROM publication_requests WHERE id = :id
        """), {"id": request_id}).fetchone()

        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        if req.status != "Pending":
            raise HTTPException(status_code=400, detail="Request already processed")

        # Get the draft file_url
        draft = db.execute(text("""
            SELECT file_url FROM student_drafts WHERE id = :id
        """), {"id": str(req.draft_id)}).fetchone()

        file_url = draft.file_url if draft else ""

        # Add to papers table
        db.execute(text("""
            INSERT INTO papers (title, authors, abstract, category, methodology, year, file_url, uploaded_by)
            VALUES (:title, :authors, :abstract, :category, :methodology, :year, :file_url, :uploaded_by)
        """), {
            "title": req.title,
            "authors": req.authors,
            "abstract": req.abstract or "",
            "category": req.category or "",
            "methodology": req.methodology or "",
            "year": req.year or 2024,
            "file_url": file_url,
            "uploaded_by": user["id"]
        })

        # Update request status
        db.execute(text("""
            UPDATE publication_requests SET status = 'Approved' WHERE id = :id
        """), {"id": request_id})

        db.commit()

        return {"message": "Publication approved and paper added to repository"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Instructor: reject publication request ──
@router.post("/publish-reject/{request_id}")
def reject_publication(
    request_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        if user["role"] not in ["instructor", "admin"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        reason = payload.get("reason", "").strip()
        if not reason:
            raise HTTPException(status_code=400, detail="Rejection reason is required")

        req = db.execute(text("""
            SELECT id, status FROM publication_requests WHERE id = :id
        """), {"id": request_id}).fetchone()

        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        if req.status != "Pending":
            raise HTTPException(status_code=400, detail="Request already processed")

        db.execute(text("""
            UPDATE publication_requests
            SET status = 'Rejected', rejection_reason = :reason
            WHERE id = :id
        """), {"reason": reason, "id": request_id})

        db.commit()

        return {"message": "Publication request rejected"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))