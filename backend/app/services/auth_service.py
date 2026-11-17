"""JWT authentication service."""
from __future__ import annotations
import os
import datetime
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.teacher import Teacher
from app.utils.security import hash_password, verify_password  # noqa: re-export

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-at-least-32-chars-long!!")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (
        expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_teacher(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Teacher:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id: int = int(payload.get("sub", 0))
    except (JWTError, ValueError):
        raise credentials_exception
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if teacher is None or not teacher.is_active:
        raise credentials_exception
    return teacher


def create_default_teacher(db: Session) -> None:
    """Seed default teacher if none exists (called at startup)."""
    email = os.getenv("DEFAULT_TEACHER_EMAIL", "teacher@school.com")
    if not db.query(Teacher).filter(Teacher.email == email).first():
        teacher = Teacher(
            email=email,
            hashed_password=hash_password(
                os.getenv("DEFAULT_TEACHER_PASSWORD", "password123")
            ),
            full_name="Default Teacher",
            is_active=True,
        )
        db.add(teacher)
        db.commit()
