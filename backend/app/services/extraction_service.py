"""Extraction service – question extraction and answer key extraction/generation."""
import os
import shutil
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.answer_key import AnswerKey
from app.models.exam import Exam
from app.services.pdf_service import convert_pdf_to_images
from app.services.gemini_service import call_vision, call_text
from app.services.job_service import update_job_status
from app.prompts.question_extraction import QUESTION_EXTRACTION_PROMPT
from app.prompts.answer_key_extraction import ANSWER_KEY_EXTRACTION_PROMPT
from app.prompts.model_answer_generation import build_model_answer_generation_prompt
from app.utils.json_utils import safe_parse_json, repair_json_prompt


def extract_questions_from_file(
    file_path: str,
    exam_id: int,
    db: Session,
    job_id: Optional[int] = None,
) -> List[Question]:
    """
    Convert question paper file to images, call Gemini to extract questions,
    and save them to the database.
    """
    try:
        if job_id:
            update_job_status(db, job_id, "running", 20, "Converting question paper to images")

        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        if not exam:
            raise ValueError(f"Exam {exam_id} not found")

        # Determine if PDF or image
        ext = os.path.splitext(file_path)[1].lower()
        image_paths: list[str] = []
        temp_dir = os.path.join("uploads", "temp", f"exam_{exam_id}_qp")
        os.makedirs(temp_dir, exist_ok=True)

        if ext == ".pdf":
            image_paths = convert_pdf_to_images(file_path, temp_dir, dpi=200)
        elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
            image_paths = [file_path]
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

        if not image_paths:
            raise ValueError("No images generated from question paper file")

        if job_id:
            update_job_status(db, job_id, "running", 50, f"Analyzing {len(image_paths)} pages with Gemini AI")

        # Call Gemini Vision with question extraction prompt
        raw_response = call_vision(image_paths, QUESTION_EXTRACTION_PROMPT)
        parsed = safe_parse_json(raw_response)

        # Retry once with repair prompt if JSON decode fails
        if not parsed or "questions" not in parsed:
            if job_id:
                update_job_status(db, job_id, "running", 70, "Repairing structured format")
            repair_p = repair_json_prompt(
                raw_response,
                '{"questions": [{"question_no": "1", "question_text": "...", "max_marks": 2.0, "question_type": "short", "sub_parts": []}]}'
            )
            repaired_resp = call_text(repair_p)
            parsed = safe_parse_json(repaired_resp)

        if not parsed or "questions" not in parsed:
            raise ValueError("Failed to extract valid question list from AI response")

        extracted_questions = parsed["questions"]

        # Clear existing unconfirmed questions if re-extracting
        db.query(Question).filter(Question.exam_id == exam_id, Question.teacher_confirmed == False).delete()
        db.commit()

        created_questions: list[Question] = []
        total_extracted_marks = 0.0

        for idx, q_data in enumerate(extracted_questions):
            q_no = str(q_data.get("question_no", str(idx + 1))).strip()
            q_text = str(q_data.get("question_text", "")).strip()
            try:
                max_m = float(q_data.get("max_marks", 1.0))
            except (ValueError, TypeError):
                max_m = 1.0
            total_extracted_marks += max_m
            q_type = str(q_data.get("question_type", "short")).strip()
            sub_parts = q_data.get("sub_parts", [])
            if not isinstance(sub_parts, list):
                sub_parts = []

            question = Question(
                exam_id=exam_id,
                question_no=q_no,
                question_text=q_text,
                max_marks=max_m,
                question_type=q_type,
                sub_parts=sub_parts,
                order_index=idx,
                ai_extracted=True,
                teacher_confirmed=False,
            )
            db.add(question)
            created_questions.append(question)

        # Update exam total marks if not previously set
        if not exam.total_marks or exam.total_marks <= 0:
            exam.total_marks = total_extracted_marks

        db.commit()

        if job_id:
            update_job_status(db, job_id, "done", 100, f"Extracted {len(created_questions)} questions successfully")

        return created_questions

    except Exception as e:
        db.rollback()
        if job_id:
            update_job_status(db, job_id, "failed", 0, "Question extraction failed", str(e))
        raise


def extract_answer_key_from_file(
    file_path: str,
    exam_id: int,
    db: Session,
    job_id: Optional[int] = None,
) -> List[AnswerKey]:
    """
    Extract answer keys from uploaded document and map to existing questions.
    """
    try:
        if job_id:
            update_job_status(db, job_id, "running", 20, "Converting answer key to images")

        ext = os.path.splitext(file_path)[1].lower()
        temp_dir = os.path.join("uploads", "temp", f"exam_{exam_id}_ak")
        os.makedirs(temp_dir, exist_ok=True)

        if ext == ".pdf":
            image_paths = convert_pdf_to_images(file_path, temp_dir, dpi=200)
        elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
            image_paths = [file_path]
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

        if job_id:
            update_job_status(db, job_id, "running", 50, "Analyzing answer key with Gemini AI")

        raw_response = call_vision(image_paths, ANSWER_KEY_EXTRACTION_PROMPT)
        parsed = safe_parse_json(raw_response)

        if not parsed or "answer_keys" not in parsed:
            repair_p = repair_json_prompt(
                raw_response,
                '{"answer_keys": [{"question_no": "1", "model_answer": "...", "key_points": ["..."], "marking_scheme": "...", "marks_split": {}}]}'
            )
            parsed = safe_parse_json(call_text(repair_p))

        if not parsed or "answer_keys" not in parsed:
            raise ValueError("Failed to extract valid answer keys from AI response")

        # Map to existing questions
        questions = db.query(Question).filter(Question.exam_id == exam_id).all()
        q_map = {q.question_no.strip().lower(): q for q in questions}

        created_keys: list[AnswerKey] = []
        for ak_data in parsed["answer_keys"]:
            q_no = str(ak_data.get("question_no", "")).strip().lower()
            matching_q = q_map.get(q_no)
            if not matching_q:
                # Try finding numeric prefix match (e.g. "1" matches "1(a)")
                for q in questions:
                    if q.question_no.strip().lower() in q_no or q_no in q.question_no.strip().lower():
                        matching_q = q
                        break

            if not matching_q:
                continue

            # Check if answer key already exists for this question
            existing_ak = db.query(AnswerKey).filter(AnswerKey.question_id == matching_q.id).first()
            if not existing_ak:
                existing_ak = AnswerKey(exam_id=exam_id, question_id=matching_q.id)
                db.add(existing_ak)

            existing_ak.model_answer = ak_data.get("model_answer", "")
            existing_ak.key_points = ak_data.get("key_points", [])
            existing_ak.marking_scheme = ak_data.get("marking_scheme", "")
            existing_ak.marks_split = ak_data.get("marks_split", {})
            existing_ak.is_ai_generated = False
            existing_ak.teacher_confirmed = False
            created_keys.append(existing_ak)

        db.commit()

        if job_id:
            update_job_status(db, job_id, "done", 100, f"Mapped {len(created_keys)} answer keys successfully")

        return created_keys

    except Exception as e:
        db.rollback()
        if job_id:
            update_job_status(db, job_id, "failed", 0, "Answer key extraction failed", str(e))
        raise


def generate_ai_answer_key(
    exam_id: int,
    db: Session,
    job_id: Optional[int] = None,
) -> List[AnswerKey]:
    """
    Generate model answers and marking schemes using Gemini when no answer key was uploaded.
    Marks them clearly as is_ai_generated=True.
    """
    try:
        if job_id:
            update_job_status(db, job_id, "running", 20, "Loading questions for AI answer key generation")

        exam = db.query(Exam).filter(Exam.id == exam_id).first()
        questions = db.query(Question).filter(Question.exam_id == exam_id).order_by(Question.order_index).all()

        if not questions:
            raise ValueError("No questions found for this exam. Please upload question paper first.")

        q_dicts = [
            {
                "question_no": q.question_no,
                "question_text": q.question_text,
                "max_marks": q.max_marks,
                "question_type": q.question_type,
            }
            for q in questions
        ]

        if job_id:
            update_job_status(db, job_id, "running", 50, f"Generating ideal answers for {len(questions)} questions")

        prompt = build_model_answer_generation_prompt(
            questions=q_dicts,
            subject=exam.subject or "General",
            exam_title=exam.title or "Exam",
        )

        raw_response = call_text(prompt)
        parsed = safe_parse_json(raw_response)

        if not parsed or "answer_keys" not in parsed:
            repair_p = repair_json_prompt(
                raw_response,
                '{"answer_keys": [{"question_no": "1", "model_answer": "...", "key_points": ["..."], "marking_scheme": "...", "marks_split": {}}]}'
            )
            parsed = safe_parse_json(call_text(repair_p))

        if not parsed or "answer_keys" not in parsed:
            raise ValueError("Failed to generate valid model answers")

        q_map = {q.question_no.strip().lower(): q for q in questions}
        created_keys: list[AnswerKey] = []

        for ak_data in parsed["answer_keys"]:
            q_no = str(ak_data.get("question_no", "")).strip().lower()
            matching_q = q_map.get(q_no)
            if not matching_q:
                for q in questions:
                    if q.question_no.strip().lower() in q_no or q_no in q.question_no.strip().lower():
                        matching_q = q
                        break

            if not matching_q:
                continue

            existing_ak = db.query(AnswerKey).filter(AnswerKey.question_id == matching_q.id).first()
            if not existing_ak:
                existing_ak = AnswerKey(exam_id=exam_id, question_id=matching_q.id)
                db.add(existing_ak)

            existing_ak.model_answer = ak_data.get("model_answer", "")
            existing_ak.key_points = ak_data.get("key_points", [])
            existing_ak.marking_scheme = ak_data.get("marking_scheme", "")
            existing_ak.marks_split = ak_data.get("marks_split", {})
            existing_ak.is_ai_generated = True
            existing_ak.teacher_confirmed = False
            created_keys.append(existing_ak)

        db.commit()

        if job_id:
            update_job_status(db, job_id, "done", 100, f"Generated {len(created_keys)} AI model answers successfully")

        return created_keys

    except Exception as e:
        db.rollback()
        if job_id:
            update_job_status(db, job_id, "failed", 0, "AI answer key generation failed", str(e))
        raise
