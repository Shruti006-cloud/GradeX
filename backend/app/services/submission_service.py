"""Submission service – student answer sheet storage, metadata, and finalization."""
import os
import shutil
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.models.student_submission import StudentSubmission
from app.models.question_evaluation import QuestionEvaluation
from app.models.audit_log import AuditLog
from app.models.exam import Exam
from app.utils.grade_utils import recompute_total, compute_percentage, compute_grade


def save_submission_pdf(upload_file: UploadFile, exam_id: int) -> str:
    """Save uploaded answer sheet PDF to uploads/exams/{exam_id}/submissions/."""
    dest_dir = os.path.join("uploads", "exams", str(exam_id), "submissions")
    os.makedirs(dest_dir, exist_ok=True)
    filename = f"{upload_file.filename}"
    dest_path = os.path.join(dest_dir, filename)
    with open(dest_path, "wb") as out:
        shutil.copyfileobj(upload_file.file, out)
    return dest_path


def create_submission(
    db: Session,
    exam_id: int,
    pdf_path: str,
    student_name: Optional[str] = None,
    roll_number: Optional[str] = None,
    class_name: Optional[str] = None,
) -> StudentSubmission:
    """Persist a new StudentSubmission."""
    submission = StudentSubmission(
        exam_id=exam_id,
        pdf_path=pdf_path,
        student_name=student_name,
        roll_number=roll_number,
        class_name=class_name,
        submission_status="uploaded",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def get_submission(db: Session, submission_id: int) -> Optional[StudentSubmission]:
    """Fetch submission by ID."""
    return db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()


def list_submissions(db: Session, exam_id: int) -> List[StudentSubmission]:
    """List all submissions for an exam."""
    return db.query(StudentSubmission).filter(StudentSubmission.exam_id == exam_id).order_by(StudentSubmission.submitted_at.desc()).all()


def update_submission_header(
    db: Session,
    submission_id: int,
    student_name: Optional[str] = None,
    roll_number: Optional[str] = None,
    class_name: Optional[str] = None,
) -> Optional[StudentSubmission]:
    """Update student header info."""
    sub = get_submission(db, submission_id)
    if not sub:
        return None
    if student_name is not None:
        sub.student_name = student_name
    if roll_number is not None:
        sub.roll_number = roll_number
    if class_name is not None:
        sub.class_name = class_name
    db.commit()
    db.refresh(sub)
    return sub


def finalize_submission(
    db: Session,
    submission_id: int,
    teacher_id: int,
) -> StudentSubmission:
    """Mark submission as finalized and write to audit log."""
    sub = get_submission(db, submission_id)
    if not sub:
        raise ValueError(f"Submission {submission_id} not found")

    sub.submission_status = "finalized"
    log = AuditLog(
        submission_id=sub.id,
        teacher_id=teacher_id,
        action="submission_finalized",
        old_value="reviewed",
        new_value="finalized",
    )
    db.add(log)
    db.commit()
    db.refresh(sub)
    return sub


def delete_submission(db: Session, submission_id: int) -> bool:
    """Delete submission and remove associated directory."""
    sub = get_submission(db, submission_id)
    if not sub:
        return False
    # Remove files
    exam_id = sub.exam_id
    sub_dir = os.path.join("uploads", "exams", str(exam_id), "submissions", str(submission_id))
    if os.path.exists(sub_dir):
        shutil.rmtree(sub_dir, ignore_errors=True)
    if sub.pdf_path and os.path.exists(sub.pdf_path):
        try:
            os.remove(sub.pdf_path)
        except OSError:
            pass

    db.delete(sub)
    db.commit()
    return True
