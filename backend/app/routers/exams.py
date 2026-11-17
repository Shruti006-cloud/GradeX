"""Exams router."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.teacher import Teacher
from app.schemas.exam import ExamCreate, ExamResponse, ExamUpdate
from app.services.auth_service import get_current_teacher
from app.services import exam_service

router = APIRouter(prefix="/exams", tags=["exams"])


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    payload: ExamCreate,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Create a new exam."""
    exam = exam_service.create_exam(db, current_teacher.id, payload)
    stats = exam_service.get_exam_stats(db, exam.id)
    resp = ExamResponse.model_validate(exam)
    for k, v in stats.items():
        if hasattr(resp, k):
            setattr(resp, k, v)
    return resp


@router.get("", response_model=List[ExamResponse])
def list_exams(
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """List all exams for the current teacher with aggregated metrics."""
    exams = exam_service.list_exams(db, current_teacher.id)
    res = []
    for ex in exams:
        stats = exam_service.get_exam_stats(db, ex.id)
        resp = ExamResponse.model_validate(ex)
        for k, v in stats.items():
            if hasattr(resp, k):
                setattr(resp, k, v)
        res.append(resp)
    return res


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(
    exam_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Get exam details with class statistics."""
    exam = exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    stats = exam_service.get_exam_stats(db, exam.id)
    resp = ExamResponse.model_validate(exam)
    for k, v in stats.items():
        if hasattr(resp, k):
            setattr(resp, k, v)
    return resp


@router.put("/{exam_id}", response_model=ExamResponse)
@router.patch("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: int,
    payload: ExamUpdate,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Update exam details."""
    exam = exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    updated = exam_service.update_exam(db, exam, payload)
    stats = exam_service.get_exam_stats(db, updated.id)
    resp = ExamResponse.model_validate(updated)
    for k, v in stats.items():
        if hasattr(resp, k):
            setattr(resp, k, v)
    return resp


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Delete an exam."""
    exam = exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    exam_service.delete_exam(db, exam)
    return None
