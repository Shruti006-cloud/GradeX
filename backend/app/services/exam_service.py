"""Exam service – business logic for exam CRUD and summary metrics."""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.exam import Exam
from app.models.student_submission import StudentSubmission
from app.models.question_evaluation import QuestionEvaluation
from app.schemas.exam import ExamCreate, ExamUpdate
from app.utils.grade_utils import recompute_total, compute_percentage


def create_exam(db: Session, teacher_id: int, payload: ExamCreate) -> Exam:
    """Persist a new exam and return it."""
    exam = Exam(
        teacher_id=teacher_id,
        title=payload.title,
        subject=payload.subject,
        class_name=payload.class_name,
        description=payload.description,
        total_marks=payload.total_marks,
        status=payload.status or "draft",
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def get_exam(db: Session, exam_id: int) -> Optional[Exam]:
    """Return an exam by id or None."""
    return db.query(Exam).filter(Exam.id == exam_id).first()


def list_exams(db: Session, teacher_id: int) -> List[Exam]:
    """Return all exams belonging to a teacher."""
    return db.query(Exam).filter(Exam.teacher_id == teacher_id).order_by(Exam.created_at.desc()).all()


def update_exam(db: Session, exam: Exam, payload: ExamUpdate) -> Exam:
    """Apply partial update to an exam."""
    if payload.title is not None:
        exam.title = payload.title
    if payload.subject is not None:
        exam.subject = payload.subject
    if payload.class_name is not None:
        exam.class_name = payload.class_name
    if payload.description is not None:
        exam.description = payload.description
    if payload.total_marks is not None:
        exam.total_marks = payload.total_marks
    if payload.status is not None:
        exam.status = payload.status

    db.commit()
    db.refresh(exam)
    return exam


def delete_exam(db: Session, exam: Exam) -> None:
    """Hard-delete an exam and cascade."""
    db.delete(exam)
    db.commit()


def get_exam_stats(db: Session, exam_id: int) -> dict:
    """Compute aggregate class metrics: total students, evaluated count, average, highest, lowest."""
    exam = get_exam(db, exam_id)
    if not exam:
        return {}

    submissions = db.query(StudentSubmission).filter(StudentSubmission.exam_id == exam_id).all()
    evaluated = [s for s in submissions if s.submission_status in ["evaluated", "reviewed", "finalized"]]

    scores = []
    for s in evaluated:
        evals = db.query(QuestionEvaluation).filter(QuestionEvaluation.submission_id == s.id).all()
        scores.append(recompute_total(evals))

    total_submissions = len(submissions)
    evaluated_count = len(evaluated)
    class_average = round(sum(scores) / len(scores), 2) if scores else 0.0
    highest_score = max(scores) if scores else 0.0
    lowest_score = min(scores) if scores else 0.0

    return {
        "total_submissions": total_submissions,
        "evaluated_count": evaluated_count,
        "class_average": class_average,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "total_marks": exam.total_marks or 0.0,
    }
