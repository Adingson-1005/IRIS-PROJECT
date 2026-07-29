from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import text
import bcrypt
import openpyxl
import io

router = APIRouter()


@router.get("/list")
def list_users(db: Session = Depends(get_db)):
    try:
        users = db.execute(text("""
            SELECT id, email, full_name, role, class_name, created_at
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

        db.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
        db.commit()
        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}


@router.post("/bulk-upload")
async def bulk_upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    authorization: str = Header(...)
):
    try:
        from jose import jwt
        import os
        SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        role = payload.get("role")

        if role != "admin":
            raise HTTPException(status_code=403, detail="Admin only")

        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only Excel files (.xlsx or .xls) are allowed")

        contents = await file.read()
        wb = openpyxl.load_workbook(io.BytesIO(contents))
        ws = wb.active

        created = []
        skipped = []
        errors = []

        for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            # Skip completely empty rows
            if not any(row):
                continue

            # Extract columns: Full Name, Email, Password, Class
            try:
                full_name = str(row[0]).strip() if row[0] else None
                email = str(row[1]).strip() if row[1] else None
                password = str(row[2]).strip() if row[2] else None
                class_name = str(row[3]).strip() if len(row) > 3 and row[3] else None
            except Exception:
                errors.append(f"Row {row_num}: Could not read data")
                continue

            # Validate required fields
            if not full_name or not email or not password:
                errors.append(f"Row {row_num}: Missing full name, email, or password")
                continue

            if len(password) < 6:
                errors.append(f"Row {row_num}: Password for {email} must be at least 6 characters")
                continue

            # Check if email already exists
            existing = db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()

            if existing:
                skipped.append(email)
                continue

            # Validate class if provided
            if class_name:
                valid_class = db.execute(
                    text("SELECT id FROM classes WHERE name = :name"),
                    {"name": class_name}
                ).fetchone()
                if not valid_class:
                    errors.append(f"Row {row_num}: Class '{class_name}' does not exist")
                    continue

            # Hash password and create account
            hashed = bcrypt.hashpw(
                password.encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")

            db.execute(text("""
                INSERT INTO users (email, password, full_name, role, class_name)
                VALUES (:email, :password, :full_name, :role, :class_name)
            """), {
                "email": email,
                "password": hashed,
                "full_name": full_name,
                "role": "student",
                "class_name": class_name
            })
            created.append(email)

        db.commit()

        return {
            "message": f"Bulk upload complete",
            "created": len(created),
            "skipped": len(skipped),
            "errors": len(errors),
            "created_list": created,
            "skipped_list": skipped,
            "error_list": errors
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))