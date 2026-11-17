"""Questions and Answer Keys router."""
import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.teacher import Teacher
from app.models.exam import Exam
from app.models.question import Question
from app.models.answer_key import AnswerKey
from app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
    AnswerKeyResponse,
    AnswerKeyUpdate,
)
from app.services.auth_service import get_current_teacher
from app.services.job_service import create_job, update_job_status
from app.services.extraction_service import (
    extract_questions_from_file,
    extract_answer_key_from_file,
    generate_ai_answer_key,
)
from app.utils.file_utils import validate_file

router = APIRouter(prefix="/exams/{exam_id}", tags=["questions"])


def _run_question_extraction_bg(file_path: str, exam_id: int, job_id: int):
    db = SessionLocal()
    try:
        extract_questions_from_file(file_path, exam_id, db, job_id=job_id)
    except Exception as e:
        print(f"Background question extraction error: {e}")
    finally:
        db.close()


def _run_answer_key_extraction_bg(file_path: str, exam_id: int, job_id: int):
    db = SessionLocal()
    try:
        extract_answer_key_from_file(file_path, exam_id, db, job_id=job_id)
    except Exception as e:
        print(f"Background answer key extraction error: {e}")
    finally:
        db.close()


def _run_answer_key_generation_bg(exam_id: int, job_id: int):
    db = SessionLocal()
    try:
        generate_ai_answer_key(exam_id, db, job_id=job_id)
    except Exception as e:
        print(f"Background answer key generation error: {e}")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Questions Endpoints
# ---------------------------------------------------------------------------

@router.post("/questions/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_question_paper(
    exam_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Upload Question Paper (PDF or image) and extract questions with Gemini."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    validate_file(file, ["pdf", "image", "png", "jpeg", "jpg"], max_mb=50.0)

    # Save uploaded file
    dest_dir = os.path.join("uploads", "exams", str(exam_id), "question_paper")
    os.makedirs(dest_dir, exist_ok=True)
    saved_path = os.path.join(dest_dir, file.filename)
    with open(saved_path, "wb") as out:
        shutil.copyfileobj(file.file, out)

    job = create_job(db, job_type="question_extraction", exam_id=exam_id)
    background_tasks.add_task(_run_question_extraction_bg, saved_path, exam_id, job.id)

    return {
        "job_id": job.id,
        "message": "Question paper upload accepted. Extraction running in background.",
        "file_path": saved_path,
    }


@router.get("/questions", response_model=List[QuestionResponse])
def list_questions(
    exam_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Get all questions for this exam."""
    questions = db.query(Question).filter(Question.exam_id == exam_id).order_by(Question.order_index).all()
    return questions


@router.post("/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question_manual(
    exam_id: int,
    payload: QuestionCreate,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Manually add a question to the exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    q = Question(
        exam_id=exam_id,
        question_no=payload.question_no,
        question_text=payload.question_text,
        max_marks=payload.max_marks,
        question_type=payload.question_type or "short",
        sub_parts=payload.sub_parts or [],
        order_index=payload.order_index or 0,
        ai_extracted=False,
        teacher_confirmed=True,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.put("/questions/{question_id}", response_model=QuestionResponse)
@router.patch("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    exam_id: int,
    question_id: int,
    payload: QuestionUpdate,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Update question text, marks, sub-parts, or confirmation status."""
    q = db.query(Question).filter(Question.id == question_id, Question.exam_id == exam_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if payload.question_no is not None:
        q.question_no = payload.question_no
    if payload.question_text is not None:
        q.question_text = payload.question_text
    if payload.max_marks is not None:
        q.max_marks = payload.max_marks
    if payload.question_type is not None:
        q.question_type = payload.question_type
    if payload.sub_parts is not None:
        q.sub_parts = payload.sub_parts
    if payload.order_index is not None:
        q.order_index = payload.order_index
    if payload.teacher_confirmed is not None:
        q.teacher_confirmed = payload.teacher_confirmed

    db.commit()
    db.refresh(q)
    return q


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    exam_id: int,
    question_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Delete a question."""
    q = db.query(Question).filter(Question.id == question_id, Question.exam_id == exam_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return None


@router.post("/questions/confirm", response_model=List[QuestionResponse])
def confirm_questions(
    exam_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Confirm all extracted questions for this exam."""
    questions = db.query(Question).filter(Question.exam_id == exam_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="No questions to confirm")

    total_marks = 0.0
    for q in questions:
        q.teacher_confirmed = True
        total_marks += q.max_marks

    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if exam:
        exam.total_marks = total_marks

    db.commit()
    return questions


# ---------------------------------------------------------------------------
# Answer Key Endpoints
# ---------------------------------------------------------------------------

@router.post("/answer-key/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_answer_key(
    exam_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Upload Answer Key document (PDF or image) and extract key with Gemini."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    validate_file(file, ["pdf", "image", "png", "jpeg", "jpg"], max_mb=50.0)

    dest_dir = os.path.join("uploads", "exams", str(exam_id), "answer_key")
    os.makedirs(dest_dir, exist_ok=True)
    saved_path = os.path.join(dest_dir, file.filename)
    with open(saved_path, "wb") as out:
        shutil.copyfileobj(file.file, out)

    job = create_job(db, job_type="answer_key_extraction", exam_id=exam_id)
    background_tasks.add_task(_run_answer_key_extraction_bg, saved_path, exam_id, job.id)

    return {
        "job_id": job.id,
        "message": "Answer key upload accepted. Processing in background.",
        "file_path": saved_path,
    }


@router.post("/answer-key/generate", status_code=status.HTTP_202_ACCEPTED)
def generate_answer_key(
    exam_id: int,
    background_tasks: BackgroundTasks,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Generate model answers and marking scheme automatically via Gemini."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    questions = db.query(Question).filter(Question.exam_id == exam_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="Cannot generate answer key without questions")

    job = create_job(db, job_type="answer_key_generation", exam_id=exam_id)
    background_tasks.add_task(_run_answer_key_generation_bg, exam_id, job.id)

    return {
        "job_id": job.id,
        "message": "AI answer key generation started in background.",
    }


@router.get("/answer-key", response_model=List[AnswerKeyResponse])
def list_answer_keys(
    exam_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """List all answer keys for this exam."""
    keys = db.query(AnswerKey).filter(AnswerKey.exam_id == exam_id).all()
    q_map = {q.id: q.question_no for q in db.query(Question).filter(Question.exam_id == exam_id).all()}

    results = []
    for k in keys:
        resp = AnswerKeyResponse.model_validate(k)
        resp.question_no = q_map.get(k.question_id, "")
        results.append(resp)
    return results


@router.put("/answer-key/{ak_id}", response_model=AnswerKeyResponse)
@router.patch("/answer-key/{ak_id}", response_model=AnswerKeyResponse)
def update_answer_key(
    exam_id: int,
    ak_id: int,
    payload: AnswerKeyUpdate,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Update model answer, key points, or marking scheme."""
    ak = db.query(AnswerKey).filter(AnswerKey.id == ak_id, AnswerKey.exam_id == exam_id).first()
    if not ak:
        raise HTTPException(status_code=404, detail="Answer key entry not found")

    if payload.model_answer is not None:
        ak.model_answer = payload.model_answer
    if payload.key_points is not None:
        ak.key_points = payload.key_points
    if payload.marking_scheme is not None:
        ak.marking_scheme = payload.marking_scheme
    if payload.marks_split is not None:
        ak.marks_split = payload.marks_split
    if payload.teacher_confirmed is not None:
        ak.teacher_confirmed = payload.teacher_confirmed

    db.commit()
    db.refresh(ak)

    q = db.query(Question).filter(Question.id == ak.question_id).first()
    resp = AnswerKeyResponse.model_validate(ak)
    resp.question_no = q.question_no if q else ""
    return resp


@router.post("/answer-key/confirm", response_model=List[AnswerKeyResponse])
def confirm_answer_key(
    exam_id: int,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    """Teacher confirms all answer keys for this exam."""
    keys = db.query(AnswerKey).filter(AnswerKey.exam_id == exam_id).all()
    for k in keys:
        k.teacher_confirmed = True
    db.commit()

    q_map = {q.id: q.question_no for q in db.query(Question).filter(Question.exam_id == exam_id).all()}
    results = []
    for k in keys:
        resp = AnswerKeyResponse.model_validate(k)
        resp.question_no = q_map.get(k.question_id, "")
        results.append(resp)
    return results
