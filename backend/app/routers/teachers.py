"""Teachers router."""
from fastapi import APIRouter, Depends
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherResponse
from app.services.auth_service import get_current_teacher

router = APIRouter(prefix="/teachers", tags=["teachers"])


@router.get("/me", response_model=TeacherResponse)
def get_teacher_profile(current_teacher: Teacher = Depends(get_current_teacher)):
    """Return logged-in teacher info."""
    return current_teacher
