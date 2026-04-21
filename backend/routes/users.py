from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text

router = APIRouter()

@router.get("/list")
def list_users(db: Session = Depends(get_db)):
    try:
        users = db.execute(text("""
            SELECT id, email, full_name, role, created_at
            FROM users
            ORDER BY created_at DESC
        """)).fetchall()
        return {"users": [dict(row._mapping) for row in users]}
    except Exception as e:
        return {"error": str(e)}

@router.delete("/delete/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    try:
        user = db.execute(
            text("SELECT id, role FROM users WHERE id = :id"),
            {"id": user_id}
        ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.role == "admin":
            raise HTTPException(status_code=400, detail="Cannot delete an admin account")

        db.execute(
            text("DELETE FROM users WHERE id = :id"),
            {"id": user_id}
        )
        db.commit()
        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}