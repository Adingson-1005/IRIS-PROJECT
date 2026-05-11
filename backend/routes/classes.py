from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
from jose import jwt
import os

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


# ── Get all classes ──
@router.get("/list")
def get_classes(db: Session = Depends(get_db), authorization: str = Header(...)):
    try:
        classes = db.execute(text("""
            SELECT c.id, c.name, c.instructor_id,
                   u.full_name as instructor_name
            FROM classes c
            LEFT JOIN users u ON c.instructor_id = u.id
            ORDER BY c.name ASC
        """)).fetchall()
        return {"classes": [dict(c._mapping) for c in classes]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Admin: assign instructor to class ──
@router.post("/assign")
def assign_instructor(
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        class_id = payload.get("class_id")
        instructor_id = payload.get("instructor_id")

        db.execute(text("""
            UPDATE classes SET instructor_id = :instructor_id
            WHERE id = :class_id
        """), {"instructor_id": instructor_id, "class_id": class_id})
        db.commit()
        return {"message": "Instructor assigned successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Admin: remove instructor from class ──
@router.post("/unassign")
def unassign_instructor(
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        class_id = payload.get("class_id")
        db.execute(text("""
            UPDATE classes SET instructor_id = NULL WHERE id = :class_id
        """), {"class_id": class_id})
        db.commit()
        return {"message": "Instructor removed from class"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Student: select or update their class ──
@router.post("/select")
def select_class(
    payload: dict,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        class_name = payload.get("class_name")
        if not class_name:
            raise HTTPException(status_code=400, detail="Class name required")

        existing = db.execute(text("""
            SELECT id FROM classes WHERE name = :name
        """), {"name": class_name}).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Class not found")

        db.execute(text("""
            UPDATE users SET class_name = :class_name WHERE id = :user_id
        """), {"class_name": class_name, "user_id": user["id"]})
        db.commit()
        return {"message": "Class selected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Get current user's class ──
@router.get("/my-class")
def get_my_class(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    try:
        result = db.execute(text("""
            SELECT u.class_name, c.id as class_id,
                   c.instructor_id, i.full_name as instructor_name
            FROM users u
            LEFT JOIN classes c ON c.name = u.class_name
            LEFT JOIN users i ON c.instructor_id = i.id
            WHERE u.id = :user_id
        """), {"user_id": user["id"]}).fetchone()

        if not result:
            return {"class_name": None, "instructor_name": None}

        return dict(result._mapping)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))