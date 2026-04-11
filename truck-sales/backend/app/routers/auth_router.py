from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: str
    password: str = Field(min_length=6)
    role: str = "customer"
    full_name: str = ""
    phone: str = ""
    company: str = ""


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
def register(body: RegisterRequest):
    if body.role not in ("customer", "dealer"):
        raise HTTPException(status_code=400, detail="Can only register as customer or dealer")
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (body.username, body.email),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Username or email already taken")
        hashed = hash_password(body.password)
        cursor = conn.execute(
            "INSERT INTO users (username, email, password, role, full_name, phone, company) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (body.username, body.email, hashed, body.role, body.full_name, body.phone, body.company),
        )
        user_id = cursor.lastrowid
    token = create_access_token(user_id, body.username, body.role)
    return {
        "token": token,
        "user": {"id": user_id, "username": body.username, "email": body.email, "role": body.role, "full_name": body.full_name},
    }


@router.post("/login")
def login(body: LoginRequest):
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, username, email, password, role, full_name FROM users WHERE username = ?",
            (body.username,),
        ).fetchone()
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user["id"], user["username"], user["role"])
    return {
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"], "full_name": user["full_name"]},
    }


@router.get("/me")
def get_me(user=Depends(get_current_user)):
    return user


@router.get("/users")
def list_users(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    with get_db() as conn:
        rows = conn.execute("SELECT id, username, email, role, full_name, phone, company, is_active, created_at FROM users ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]
