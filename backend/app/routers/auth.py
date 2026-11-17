"""Auth router – login and token management."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.teacher import Teacher
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.teacher import TeacherResponse
from app.services.auth_service import (
    create_access_token,
    get_current_teacher,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate teacher and return JWT."""
    teacher = db.query(Teacher).filter(Teacher.email == payload.email).first()
    if not teacher or not verify_password(payload.password, teacher.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not teacher.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive",
        )

    token = create_access_token({"sub": str(teacher.id), "email": teacher.email})
    return TokenResponse(access_token=token, token_type="bearer")


@router.post("/logout")
def logout():
    """Client simply drops token; this endpoint confirms logout."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=TeacherResponse)
def get_me(current_teacher: Teacher = Depends(get_current_teacher)):
    """Return current authenticated teacher profile."""
    return current_teacher
