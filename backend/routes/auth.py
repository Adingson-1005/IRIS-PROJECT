from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
import bcrypt
import os

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "iris-secret")
ALGORITHM = "HS256"

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(hours=24)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        existing = db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": req.email}
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed = hash_password(req.password)
        db.execute(
            text("""
                INSERT INTO users (email, password, full_name, role)
                VALUES (:email, :password, :full_name, :role)
            """),
            {"email": req.email, "password": hashed,
             "full_name": req.full_name, "role": req.role}
        )
        db.commit()
        return {"message": "Account created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        user = db.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": req.email}
        ).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not verify_password(req.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_token({"sub": str(user.id), "role": user.role})
        return {
            "token": token,
            "role": user.role,
            "full_name": user.full_name
        }
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e)}