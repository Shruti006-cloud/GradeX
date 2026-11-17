"""Evaluations router – teacher review, marks override, re-evaluation, and audit trail."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.teacher import Teacher
from app.models.question import Question
from app.models.answer_key import AnswerKey
from app.models.question_evaluation import QuestionEvaluation
from app.models.student_submission import StudentSubmission
from app.models.audit_log import AuditLog
from app.schemas.evaluation import (
    QuestionEvaluationResponse,
    TeacherOverrideRequest,
    AuditLogResponse,
)
from app.services.auth_service import get_current_teacher
from app.services.evaluation_service import (
    apply_teacher_override,
    re_evaluate_single_question,
)
from app.services.submission_service import finalize_submission

router = APIRouter(tags=["evaluations"])


def _enrich_evaluation(ev: QuestionEvaluation, db: Session) -> QuestionEvaluationResponse:
    q = db.query(Question).filter(Question.id == ev.question_id).first()
    ak = db.query(AnswerKey).filter(AnswerKey.question_id == ev.question_id).first()

    resp = QuestionEvaluationResponse.model_validate(ev)
    if q:
        resp.question_no = q.question_no
        resp.question_text = q.question_text
        resp.max_marks = q.max_marks
    if ak:
        resp.model_answer = ak.model_answer
        resp.key_points = ak.key_points or []
    return resp


@router.get("/submissions/{submission_id}/evaluations", response_model=List[QuestionEvaluationResponse])
def get_submission_evaluations(
    submission_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Fetch all question evaluations for a student submission with questions and model answers."""
    sub = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    evals = (
        db.query(QuestionEvaluation)
        .filter(QuestionEvaluation.submission_id == submission_id)
        .join(Question, Question.id == QuestionEvaluation.question_id)
        .order_by(Question.order_index)
        .all()
    )

    return [_enrich_evaluation(e, db) for e in evals]


@router.put("/evaluations/{eval_id}/marks", response_model=QuestionEvaluationResponse)
@router.patch("/evaluations/{eval_id}/marks", response_model=QuestionEvaluationResponse)
def override_marks(
    eval_id: int,
    payload: TeacherOverrideRequest,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Teacher overrides marks for a question with audit trail logging."""
    ev = db.query(QuestionEvaluation).filter(QuestionEvaluation.id == eval_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Question evaluation not found")

    updated = apply_teacher_override(
        evaluation_id=eval_id,
        new_marks=payload.final_marks,
        comment=payload.teacher_comment,
        teacher_id=current_teacher.id,
        db=db,
    )

    return _enrich_evaluation(updated, db)


@router.post("/evaluations/{eval_id}/re-evaluate", response_model=QuestionEvaluationResponse)
def re_evaluate_question(
    eval_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Re-run Gemini Vision grading for this single question."""
    ev = db.query(QuestionEvaluation).filter(QuestionEvaluation.id == eval_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Question evaluation not found")

    updated = re_evaluate_single_question(eval_id, db)
    return _enrich_evaluation(updated, db)


@router.post("/submissions/{submission_id}/finalize")
def finalize_student_submission(
    submission_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Mark evaluation as reviewed, approved, and finalized."""
    sub = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    finalized = finalize_submission(db, submission_id=submission_id, teacher_id=current_teacher.id)
    return {
        "message": "Submission approved and finalized.",
        "submission_id": finalized.id,
        "status": finalized.submission_status,
    }


@router.get("/submissions/{submission_id}/audit-log", response_model=List[AuditLogResponse])
def get_submission_audit_log(
    submission_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Get audit trail of changes made to this submission."""
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.submission_id == submission_id)
        .order_by(AuditLog.timestamp.desc())
        .all()
    )
    return logs
