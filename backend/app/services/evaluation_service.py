"""Evaluation service – orchestrates AI grading pipeline, student header detection, and teacher override."""
import os
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.student_submission import StudentSubmission
from app.models.question import Question
from app.models.answer_key import AnswerKey
from app.models.question_evaluation import QuestionEvaluation
from app.models.audit_log import AuditLog
from app.models.exam import Exam
from app.services.pdf_service import convert_pdf_to_images
from app.services.gemini_service import call_vision, call_text
from app.services.job_service import update_job_status
from app.prompts.header_detection import HEADER_DETECTION_PROMPT
from app.prompts.answer_grading import build_answer_grading_prompt
from app.prompts.report_remarks import build_report_remarks_prompt
from app.utils.json_utils import safe_parse_json, repair_json_prompt
from app.utils.grade_utils import recompute_total, compute_percentage, compute_grade


def detect_student_header(
    image_paths: List[str],
    submission: StudentSubmission,
    db: Session,
) -> None:
    """Read student name, roll number, and class from first page header using Gemini vision."""
    if not image_paths:
        return

    try:
        raw_resp = call_vision([image_paths[0]], HEADER_DETECTION_PROMPT)
        parsed = safe_parse_json(raw_resp)
        if parsed:
            name = parsed.get("student_name")
            roll = parsed.get("roll_number")
            cls = parsed.get("class_name")

            if name and str(name).strip().lower() not in ["null", "none", "not found", ""]:
                submission.ai_detected_name = str(name).strip()
                if not submission.student_name:
                    submission.student_name = submission.ai_detected_name

            if roll and str(roll).strip().lower() not in ["null", "none", "not found", ""]:
                submission.ai_detected_roll = str(roll).strip()
                if not submission.roll_number:
                    submission.roll_number = submission.ai_detected_roll

            if cls and str(cls).strip().lower() not in ["null", "none", "not found", ""]:
                if not submission.class_name:
                    submission.class_name = str(cls).strip()

            db.commit()
    except Exception as e:
        print(f"Header detection warning: {e}")


def evaluate_submission(
    db: Session,
    submission_id: int,
    job_id: Optional[int] = None,
) -> List[QuestionEvaluation]:
    """
    Main evaluation pipeline:
    1. Convert PDF to 200 DPI images if needed.
    2. Detect student header from page 1.
    3. Grade each question with Gemini vision against answer key / marking scheme.
    4. Server-side validation, clamping, and recomputing totals.
    5. Flag unreadable / low-confidence / unanswered.
    6. Generate overall report remarks.
    """
    try:
        submission = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        exam = db.query(Exam).filter(Exam.id == submission.exam_id).first()
        if not exam:
            raise ValueError(f"Exam {submission.exam_id} not found")

        submission.submission_status = "processing"
        db.commit()

        # Step 1: PDF to Images
        if job_id:
            update_job_status(db, job_id, "running", 15, "Converting answer sheet PDF to high-res images")

        images_dir = os.path.join("uploads", "exams", str(exam.id), "submissions", str(submission.id), "pages")
        os.makedirs(images_dir, exist_ok=True)

        if not submission.page_image_paths or len(submission.page_image_paths) == 0:
            if not submission.pdf_path or not os.path.exists(submission.pdf_path):
                raise ValueError(f"PDF file missing for submission {submission_id}")

            image_paths = convert_pdf_to_images(submission.pdf_path, images_dir, dpi=200)
            submission.page_image_paths = image_paths
            submission.total_pages = len(image_paths)
            db.commit()
        else:
            image_paths = submission.page_image_paths

        if not image_paths:
            raise ValueError("No pages extracted from student answer sheet")

        # Step 2: Detect Student Header
        if job_id:
            update_job_status(db, job_id, "running", 25, "Detecting student details from cover page")

        detect_student_header(image_paths, submission, db)

        # Step 3: Grade Each Question
        questions = db.query(Question).filter(Question.exam_id == exam.id).order_by(Question.order_index).all()
        if not questions:
            raise ValueError("No questions found for this exam. Please upload and confirm questions first.")

        # Pre-fetch answer keys
        answer_keys = db.query(AnswerKey).filter(AnswerKey.exam_id == exam.id).all()
        ak_map = {ak.question_id: ak for ak in answer_keys}

        total_questions = len(questions)
        evaluations: list[QuestionEvaluation] = []

        # Clear any prior evaluations for this submission
        db.query(QuestionEvaluation).filter(QuestionEvaluation.submission_id == submission.id).delete()
        db.commit()

        for idx, q in enumerate(questions):
            pct = 25 + int((idx / total_questions) * 60)
            if job_id:
                update_job_status(
                    db,
                    job_id,
                    "running",
                    pct,
                    f"Evaluating Question {q.question_no} ({idx + 1}/{total_questions})",
                )

            ak = ak_map.get(q.id)
            model_ans = ak.model_answer if ak else ""
            key_pts = ak.key_points if ak else []
            scheme = ak.marking_scheme if ak else ""

            grading_prompt = build_answer_grading_prompt(
                question_no=q.question_no,
                question_text=q.question_text,
                max_marks=q.max_marks,
                model_answer=model_ans,
                key_points=key_pts,
                marking_scheme=scheme,
                total_pages=len(image_paths),
            )

            # Call Gemini Vision with all pages of the student sheet
            raw_eval = call_vision(image_paths, grading_prompt)
            parsed_eval = safe_parse_json(raw_eval)

            if not parsed_eval or "marks_awarded" not in parsed_eval:
                repair_p = repair_json_prompt(
                    raw_eval,
                    f'{{"question_no": "{q.question_no}", "transcribed_answer": "...", "page_numbers": [1], "marks_awarded": 0.0, "max_marks": {q.max_marks}, "key_points_matched": [], "key_points_missed": [], "mistakes": [], "feedback": "...", "confidence": 0.9}}'
                )
                parsed_eval = safe_parse_json(call_text(repair_p))

            if not parsed_eval:
                # Fallback to zero marks if model completely fails to reply in JSON
                parsed_eval = {
                    "question_no": q.question_no,
                    "transcribed_answer": "Failed to parse evaluation",
                    "page_numbers": [],
                    "marks_awarded": 0.0,
                    "max_marks": q.max_marks,
                    "key_points_matched": [],
                    "key_points_missed": key_pts,
                    "mistakes": ["Evaluation parsing failure"],
                    "feedback": "AI evaluation could not be processed automatically. Teacher review required.",
                    "confidence": 0.2,
                }

            # Server-side validation and clamping
            try:
                raw_marks = float(parsed_eval.get("marks_awarded", 0.0))
            except (ValueError, TypeError):
                raw_marks = 0.0
            clamped_marks = max(0.0, min(raw_marks, float(q.max_marks)))

            try:
                confidence = float(parsed_eval.get("confidence", 0.9))
            except (ValueError, TypeError):
                confidence = 0.8
            confidence = max(0.0, min(1.0, confidence))

            transcribed = str(parsed_eval.get("transcribed_answer", "")).strip()
            pages = parsed_eval.get("page_numbers", [])
            if not isinstance(pages, list):
                pages = [1] if len(image_paths) > 0 else []

            # Determine flags
            is_flagged = False
            flag_reason = None
            lower_trans = transcribed.lower()

            if any(term in lower_trans for term in ["not attempted", "unanswered", "blank", "none"]):
                is_flagged = True
                flag_reason = "Unanswered question"
            elif any(term in lower_trans for term in ["[unreadable", "illegible", "cannot read"]):
                is_flagged = True
                flag_reason = "Unreadable handwriting"
            elif confidence < 0.6:
                is_flagged = True
                flag_reason = "Low confidence result (< 0.6)"

            evaluation = QuestionEvaluation(
                submission_id=submission.id,
                question_id=q.id,
                question_no=q.question_no,
                transcribed_answer=transcribed,
                page_numbers=pages,
                ai_marks=clamped_marks,
                final_marks=clamped_marks,
                max_marks=q.max_marks,
                key_points_matched=parsed_eval.get("key_points_matched", []),
                key_points_missed=parsed_eval.get("key_points_missed", []),
                mistakes=parsed_eval.get("mistakes", []),
                feedback=parsed_eval.get("feedback", ""),
                confidence=confidence,
                is_flagged=is_flagged,
                flag_reason=flag_reason,
                is_overridden=False,
            )
            db.add(evaluation)
            evaluations.append(evaluation)

        db.commit()

        # Step 4: Generate overall report remarks
        if job_id:
            update_job_status(db, job_id, "running", 90, "Generating comprehensive performance remarks")

        total_awarded = recompute_total(evaluations)
        max_total = sum(q.max_marks for q in questions)
        pct = compute_percentage(total_awarded, max_total)

        summary_payload = [
            {
                "question_no": ev.question_no,
                "marks_awarded": ev.final_marks,
                "max_marks": ev.max_marks,
                "feedback": ev.feedback,
            }
            for ev in evaluations
        ]

        remarks_prompt = build_report_remarks_prompt(
            student_name=submission.student_name or "Student",
            subject=exam.subject or "General",
            total_marks=total_awarded,
            max_total=max_total,
            percentage=pct,
            evaluations_summary=summary_payload,
        )

        try:
            remarks_resp = call_text(remarks_prompt)
            remarks_parsed = safe_parse_json(remarks_resp)
            if remarks_parsed:
                # Save audit log entry for remarks creation
                log = AuditLog(
                    submission_id=submission.id,
                    action="remarks_generated",
                    new_value=str(remarks_parsed),
                )
                db.add(log)
                db.commit()
        except Exception as e:
            print(f"Remarks generation warning: {e}")

        submission.submission_status = "evaluated"
        db.commit()

        if job_id:
            update_job_status(
                db,
                job_id,
                "done",
                100,
                f"Evaluated all {len(evaluations)} answers. Score: {total_awarded}/{max_total} ({pct}%)",
            )

        return evaluations

    except Exception as e:
        db.rollback()
        if job_id:
            update_job_status(db, job_id, "failed", 0, "Evaluation failed", str(e))
        if submission:
            submission.submission_status = "failed"
            db.commit()
        raise


def re_evaluate_single_question(
    evaluation_id: int,
    db: Session,
) -> QuestionEvaluation:
    """Re-run Gemini evaluation for a single question."""
    ev = db.query(QuestionEvaluation).filter(QuestionEvaluation.id == evaluation_id).first()
    if not ev:
        raise ValueError(f"QuestionEvaluation {evaluation_id} not found")

    submission = db.query(StudentSubmission).filter(StudentSubmission.id == ev.submission_id).first()
    q = db.query(Question).filter(Question.id == ev.question_id).first()
    ak = db.query(AnswerKey).filter(AnswerKey.question_id == q.id).first()

    image_paths = submission.page_image_paths or []

    grading_prompt = build_answer_grading_prompt(
        question_no=q.question_no,
        question_text=q.question_text,
        max_marks=q.max_marks,
        model_answer=ak.model_answer if ak else "",
        key_points=ak.key_points if ak else [],
        marking_scheme=ak.marking_scheme if ak else "",
        total_pages=len(image_paths),
    )

    raw_eval = call_vision(image_paths, grading_prompt)
    parsed = safe_parse_json(raw_eval)

    if not parsed or "marks_awarded" not in parsed:
        repair_p = repair_json_prompt(
            raw_eval,
            f'{{"question_no": "{q.question_no}", "transcribed_answer": "...", "page_numbers": [1], "marks_awarded": 0.0, "max_marks": {q.max_marks}, "key_points_matched": [], "key_points_missed": [], "mistakes": [], "feedback": "...", "confidence": 0.9}}'
        )
        parsed = safe_parse_json(call_text(repair_p))

    if parsed:
        try:
            raw_marks = float(parsed.get("marks_awarded", 0.0))
        except (ValueError, TypeError):
            raw_marks = 0.0
        clamped_marks = max(0.0, min(raw_marks, float(q.max_marks)))

        try:
            confidence = float(parsed.get("confidence", 0.9))
        except (ValueError, TypeError):
            confidence = 0.8

        ev.transcribed_answer = str(parsed.get("transcribed_answer", "")).strip()
        ev.page_numbers = parsed.get("page_numbers", ev.page_numbers)
        ev.ai_marks = clamped_marks
        ev.final_marks = clamped_marks
        ev.key_points_matched = parsed.get("key_points_matched", [])
        ev.key_points_missed = parsed.get("key_points_missed", [])
        ev.mistakes = parsed.get("mistakes", [])
        ev.feedback = parsed.get("feedback", "")
        ev.confidence = confidence
        ev.is_overridden = False

        db.commit()
        db.refresh(ev)

    return ev


def apply_teacher_override(
    evaluation_id: int,
    new_marks: float,
    comment: Optional[str],
    teacher_id: int,
    db: Session,
) -> QuestionEvaluation:
    """Apply manual teacher override on a question's marks and log in AuditLog."""
    ev = db.query(QuestionEvaluation).filter(QuestionEvaluation.id == evaluation_id).first()
    if not ev:
        raise ValueError(f"QuestionEvaluation {evaluation_id} not found")

    old_marks = ev.final_marks
    clamped_marks = max(0.0, min(float(new_marks), float(ev.max_marks)))

    ev.final_marks = clamped_marks
    ev.is_overridden = True
    if comment is not None:
        ev.teacher_comment = comment

    # Log audit trail
    log = AuditLog(
        submission_id=ev.submission_id,
        question_evaluation_id=ev.id,
        teacher_id=teacher_id,
        action="marks_override",
        old_value=str(old_marks),
        new_value=str(clamped_marks),
    )
    db.add(log)

    # Mark submission as reviewed
    submission = db.query(StudentSubmission).filter(StudentSubmission.id == ev.submission_id).first()
    if submission and submission.submission_status == "evaluated":
        submission.submission_status = "reviewed"

    db.commit()
    db.refresh(ev)
    return ev
