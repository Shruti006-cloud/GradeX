"""Verify full AI pipeline using real Gemini API key."""
import os
from app.database import SessionLocal, Base, engine
from app.models.exam import Exam
from app.models.question import Question
from app.models.answer_key import AnswerKey
from app.models.student_submission import StudentSubmission
from app.services.extraction_service import extract_questions_from_file, generate_ai_answer_key
from app.services.evaluation_service import evaluate_submission
from app.services.report_service import get_report_data, generate_submission_pdf

print("=== TESTING REAL GEMINI AI PIPELINE ===")
db = SessionLocal()

# 1. Create a Test Exam
exam = Exam(
    teacher_id=1,
    title="Gemini Live Assessment",
    subject="Mathematics",
    class_name="10-A",
    total_marks=13.0,
    status="draft"
)
db.add(exam)
db.commit()
db.refresh(exam)
print(f"[1/4] Created Exam ID: {exam.id}")

# 2. Extract Questions from PDF using Gemini Vision
qp_pdf = "uploads/samples/sample_question_paper.pdf"
print(f"[2/4] Extracting questions from {qp_pdf} via Gemini...")
questions = extract_questions_from_file(qp_pdf, exam.id, db)
print(f" -> Extracted {len(questions)} questions:")
for q in questions:
    print(f"    Q{q.question_no} ({q.max_marks}m, {q.question_type}): {q.question_text[:50]}...")

# 3. Generate AI Answer Key for questions
print(f"[3/4] Generating AI Model Answers and Marking Scheme via Gemini...")
answer_keys = generate_ai_answer_key(exam.id, db)
print(f" -> Generated {len(answer_keys)} answer keys:")
for ak in answer_keys:
    print(f"    Q{ak.question_id}: Model: {ak.model_answer[:40]}... | Key points: {len(ak.key_points or [])}")

# 4. Create Student Submission & Grade with Gemini Vision
student_pdf = "uploads/samples/sample_student_answer_sheet.pdf"
sub = StudentSubmission(
    exam_id=exam.id,
    pdf_path=student_pdf,
    submission_status="uploaded"
)
db.add(sub)
db.commit()
db.refresh(sub)

print(f"[4/4] Evaluating Student Submission ID: {sub.id} via Gemini Vision...")
evaluations = evaluate_submission(db, sub.id)
db.refresh(sub)

print(f" -> Detected Student Header: Name='{sub.student_name}', Roll='{sub.roll_number}', Class='{sub.class_name}'")
print(f" -> Evaluated {len(evaluations)} answers:")
for ev in evaluations:
    print(f"    Q{ev.question_no}: Marks {ev.final_marks}/{ev.max_marks} (Conf: {ev.confidence:.2f}) - {ev.feedback[:50]}...")

# Check Report
rep = get_report_data(db, sub.id)
print(f"\nFinal Score: {rep['performance']['total_marks']}/{rep['performance']['max_marks']} ({rep['performance']['percentage']}%) Grade: {rep['performance']['grade']}")
print(f"Overall Remark: {rep['overall_remark']}")
print("\nREAL GEMINI FULL PIPELINE TEST COMPLETED SUCCESSFULLY!")
