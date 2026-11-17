"""Submissions router – answer sheet upload and management."""
import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.teacher import Teacher
from app.models.exam import Exam
from app.models.student_submission import StudentSubmission
from app.models.question import Question
from app.models.question_evaluation import QuestionEvaluation
from app.schemas.submission import SubmissionResponse, HeaderUpdate
from app.services.auth_service import get_current_teacher
from app.services.job_service import create_job
from app.services.submission_service import (
    save_submission_pdf,
    create_submission,
    get_submission,
    list_submissions,
    update_submission_header,
    delete_submission,
)
from app.services.evaluation_service import evaluate_submission
from app.utils.grade_utils import recompute_total, compute_percentage, compute_grade
from app.utils.file_utils import validate_file

router = APIRouter(tags=["submissions"])


def _run_evaluation_bg(submission_id: int, job_id: int):
    db = SessionLocal()
    try:
        evaluate_submission(db, submission_id=submission_id, job_id=job_id)
    except Exception as e:
        print(f"Background evaluation error for submission {submission_id}: {e}")
    finally:
        db.close()


def _populate_submission_response(sub: StudentSubmission, db: Session) -> SubmissionResponse:
    evals = db.query(QuestionEvaluation).filter(QuestionEvaluation.submission_id == sub.id).all()
    questions = db.query(Question).filter(Question.exam_id == sub.exam_id).all()

    tot = recompute_total(evals)
    max_m = sum(q.max_marks for q in questions) if questions else 0.0
    pct = compute_percentage(tot, max_m)
    grade = compute_grade(pct)

    # Format page image paths to serve via static files
    # uploads/exams/{exam_id}/submissions/{id}/pages/page_0001.jpg -> /uploads/exams/...
    urls = []
    if sub.page_image_paths:
        for p in sub.page_image_paths:
            normalized = p.replace("\\", "/")
            if not normalized.startswith("/"):
                normalized = "/" + normalized
            urls.append(normalized)
    else:
        # Fallback: check if images exist on disk in the standard pages folder
        pages_dir = os.path.join("uploads", "exams", str(sub.exam_id), "submissions", str(sub.id), "pages")
        if os.path.exists(pages_dir):
            files = sorted(os.listdir(pages_dir))
            for f in files:
                if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    urls.append(f"/uploads/exams/{sub.exam_id}/submissions/{sub.id}/pages/{f}")

    resp = SubmissionResponse.model_validate(sub)
    resp.total_marks = tot
    resp.max_marks = max_m
    resp.percentage = pct
    resp.grade = grade
    resp.page_image_urls = urls
    return resp


# ---------------------------------------------------------------------------
# Upload & List Submissions
# ---------------------------------------------------------------------------

@router.post("/exams/{exam_id}/submissions/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_submission(
    exam_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    student_name: Optional[str] = None,
    roll_number: Optional[str] = None,
    class_name: Optional[str] = None,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Upload a single student answer sheet PDF and start AI evaluation in background."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    validate_file(file, ["pdf"], max_mb=50.0)

    # Save PDF
    saved_pdf = save_submission_pdf(file, exam_id)

    # Create submission record
    sub = create_submission(
        db,
        exam_id=exam_id,
        pdf_path=saved_pdf,
        student_name=student_name,
        roll_number=roll_number,
        class_name=class_name or exam.class_name,
    )

    # Create job & launch background task
    job = create_job(db, job_type="submission_evaluation", submission_id=sub.id, exam_id=exam_id)
    sub.job_id = job.id
    db.commit()

    background_tasks.add_task(_run_evaluation_bg, sub.id, job.id)

    return {
        "submission_id": sub.id,
        "job_id": job.id,
        "message": "Answer sheet uploaded. Evaluation running in background.",
    }


@router.post("/exams/{exam_id}/submissions/bulk-upload", status_code=status.HTTP_202_ACCEPTED)
async def bulk_upload_submissions(
    exam_id: int,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Bulk upload multiple student answer sheet PDFs, queued for background processing."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    created = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue

        saved_pdf = save_submission_pdf(file, exam_id)
        # Infer student name from filename (e.g. John_Smith_Roll42.pdf -> John Smith)
        base_name = os.path.splitext(file.filename)[0].replace("_", " ")

        sub = create_submission(
            db,
            exam_id=exam_id,
            pdf_path=saved_pdf,
            student_name=base_name,
            class_name=exam.class_name,
        )

        job = create_job(db, job_type="submission_evaluation", submission_id=sub.id, exam_id=exam_id)
        sub.job_id = job.id
        db.commit()

        background_tasks.add_task(_run_evaluation_bg, sub.id, job.id)
        created.append({"submission_id": sub.id, "job_id": job.id, "filename": file.filename})

    return {
        "message": f"Queued {len(created)} answer sheets for background evaluation.",
        "submissions": created,
    }


@router.get("/exams/{exam_id}/submissions", response_model=List[SubmissionResponse])
def list_exam_submissions(
    exam_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """List all submissions for an exam with live scores."""
    subs = list_submissions(db, exam_id)
    return [_populate_submission_response(s, db) for s in subs]


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
def get_submission_detail(
    submission_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Get submission details including image paths."""
    sub = get_submission(db, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return _populate_submission_response(sub, db)


@router.put("/submissions/{submission_id}/header", response_model=SubmissionResponse)
def update_header(
    submission_id: int,
    payload: HeaderUpdate,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Correct or update student name, roll number, or class."""
    sub = update_submission_header(
        db,
        submission_id=submission_id,
        student_name=payload.student_name,
        roll_number=payload.roll_number,
        class_name=payload.class_name,
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return _populate_submission_response(sub, db)


@router.delete("/submissions/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission_endpoint(
    submission_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Delete a student submission."""
    success = delete_submission(db, submission_id)
    if not success:
        raise HTTPException(status_code=404, detail="Submission not found")
    return None
