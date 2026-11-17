"""Reports router – JSON, PDF, and CSV report export."""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.teacher import Teacher
from app.models.student_submission import StudentSubmission
from app.models.exam import Exam
from app.services.auth_service import get_current_teacher
from app.services.report_service import (
    get_report_data,
    generate_submission_pdf,
    generate_submission_csv,
    generate_exam_csv,
)

router = APIRouter(tags=["reports"])


@router.get("/submissions/{submission_id}/report")
def get_report_json(
    submission_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Get complete report metrics and question breakdown as JSON."""
    sub = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return get_report_data(db, submission_id)


@router.get("/submissions/{submission_id}/report/pdf")
def download_report_pdf(
    submission_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Download ReportLab PDF report for this student."""
    sub = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    pdf_bytes = generate_submission_pdf(db, submission_id)
    student_name = (sub.student_name or f"student_{sub.id}").replace(" ", "_")
    filename = f"Report_{student_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/submissions/{submission_id}/report/csv")
def download_report_csv(
    submission_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Download CSV breakdown report for this student."""
    sub = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    csv_data = generate_submission_csv(db, submission_id)
    student_name = (sub.student_name or f"student_{sub.id}").replace(" ", "_")
    filename = f"Report_{student_name}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/exams/{exam_id}/report/csv")
def download_exam_summary_csv(
    exam_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Download summary CSV for all students in an exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    csv_data = generate_exam_csv(db, exam_id)
    exam_title = (exam.title or f"exam_{exam.id}").replace(" ", "_")
    filename = f"Exam_Summary_{exam_title}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
