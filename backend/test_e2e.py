"""End-to-End test suite for AI Examiner."""
import os
import io
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.teacher import Teacher
from app.models.exam import Exam
from app.models.question import Question
from app.models.answer_key import AnswerKey
from app.models.student_submission import StudentSubmission
from app.models.question_evaluation import QuestionEvaluation
from app.models.audit_log import AuditLog
from app.services.report_service import generate_submission_pdf, generate_submission_csv, generate_exam_csv
from app.services.pdf_service import convert_pdf_to_images
from app.services.gemini_service import call_text
from app.main import _seed_default_teacher

def run_tests():
    print("=== STARTING AI EXAMINER E2E TEST ===")
    Base.metadata.create_all(bind=engine)
    _seed_default_teacher()

    client = TestClient(app)
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. /health endpoint OK")

    # 2. Login
    email = os.getenv("DEFAULT_TEACHER_EMAIL", "t@school.com")
    password = os.getenv("DEFAULT_TEACHER_PASSWORD", "pass123")
    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 2. Teacher authentication & JWT generation OK")

    # 3. Create Exam
    exam_payload = {
        "title": "Mid-Term Mathematics Assessment",
        "subject": "Mathematics",
        "class_name": "10-A",
        "total_marks": 13.0,
        "description": "Standard 10th grade calculus and algebra test"
    }
    exam_res = client.post("/api/exams", json=exam_payload, headers=headers)
    assert exam_res.status_code == 201, f"Create exam failed: {exam_res.text}"
    exam_id = exam_res.json()["id"]
    print(f"[PASS] 3. Created Exam ID: {exam_id}")

    # 4. Questions Management (Manual or Extracted)
    q1 = client.post(f"/api/exams/{exam_id}/questions", json={
        "question_no": "1",
        "question_text": "Solve for x: 3x + 7 = 22",
        "max_marks": 2.0,
        "question_type": "numerical",
        "sub_parts": []
    }, headers=headers).json()

    q2 = client.post(f"/api/exams/{exam_id}/questions", json={
        "question_no": "2",
        "question_text": "Calculate the exact value of 2^5",
        "max_marks": 1.0,
        "question_type": "short",
        "sub_parts": []
    }, headers=headers).json()

    q3 = client.post(f"/api/exams/{exam_id}/questions", json={
        "question_no": "3",
        "question_text": "Prove that the sum of angles in a triangle is 180 degrees",
        "max_marks": 3.0,
        "question_type": "short",
        "sub_parts": []
    }, headers=headers).json()

    q4 = client.post(f"/api/exams/{exam_id}/questions", json={
        "question_no": "4",
        "question_text": "A train travels 240 kilometers in 4 hours. Calculate its speed in km/h",
        "max_marks": 2.0,
        "question_type": "numerical",
        "sub_parts": []
    }, headers=headers).json()

    q5 = client.post(f"/api/exams/{exam_id}/questions", json={
        "question_no": "5",
        "question_text": "State and explain the Pythagorean theorem with side lengths 3, 4, 5",
        "max_marks": 5.0,
        "question_type": "long",
        "sub_parts": []
    }, headers=headers).json()

    # Confirm questions
    confirm_q_res = client.post(f"/api/exams/{exam_id}/questions/confirm", headers=headers)
    assert confirm_q_res.status_code == 200
    assert len(confirm_q_res.json()) == 5
    print("[PASS] 4. Created and confirmed 5 questions (Total: 13.0 marks)")

    # 5. Answer Key Setup
    db = SessionLocal()
    ak1 = AnswerKey(exam_id=exam_id, question_id=q1["id"], model_answer="3x = 15 => x = 5", key_points=["Subtract 7 to get 15", "x = 5"], marking_scheme="1 mark for method, 1 mark for answer", is_ai_generated=False, teacher_confirmed=True)
    ak2 = AnswerKey(exam_id=exam_id, question_id=q2["id"], model_answer="32", key_points=["32"], marking_scheme="1 mark for correct value", is_ai_generated=False, teacher_confirmed=True)
    ak3 = AnswerKey(exam_id=exam_id, question_id=q3["id"], model_answer="Parallel line, alternate angles equal, 180 degrees straight line", key_points=["Auxiliary line", "Alternate interior angles", "Straight line angle sum"], marking_scheme="1 mark per key concept", is_ai_generated=False, teacher_confirmed=True)
    ak4 = AnswerKey(exam_id=exam_id, question_id=q4["id"], model_answer="Speed = 240 / 4 = 60 km/h", key_points=["Speed formula", "60 km/h"], marking_scheme="1 mark for formula, 1 mark for calculation with unit", is_ai_generated=False, teacher_confirmed=True)
    ak5 = AnswerKey(exam_id=exam_id, question_id=q5["id"], model_answer="a^2 + b^2 = c^2, 3^2 + 4^2 = 9 + 16 = 25 = 5^2", key_points=["Theorem definition", "Formula a^2+b^2=c^2", "3^2+4^2 calculation", "Verification with 5^2=25"], marking_scheme="2 marks statement, 3 marks calculation", is_ai_generated=False, teacher_confirmed=True)
    db.add_all([ak1, ak2, ak3, ak4, ak5])
    db.commit()
    print("[PASS] 5. Answer Keys configured and mapped to all 5 questions")

    # 6. PDF to Image Conversion Verification
    sample_pdf = "uploads/samples/sample_student_answer_sheet.pdf"
    assert os.path.exists(sample_pdf), f"Sample student sheet missing: {sample_pdf}"
    dest_pages_dir = f"uploads/exams/{exam_id}/submissions/test_sub/pages"
    rendered_images = convert_pdf_to_images(sample_pdf, dest_pages_dir, dpi=200)
    assert len(rendered_images) == 3, f"Expected 3 pages, got {len(rendered_images)}"
    print(f"[PASS] 6. PyMuPDF converted 3-page student answer sheet to 200 DPI images: {len(rendered_images)} pages")

    # 7. Create Submission Record
    sub = StudentSubmission(
        exam_id=exam_id,
        pdf_path=sample_pdf,
        student_name="John Doe",
        roll_number="1042",
        class_name="10-A",
        page_image_paths=rendered_images,
        total_pages=3,
        submission_status="evaluated"
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    sub_id = sub.id
    print(f"[PASS] 7. Student submission created with ID: {sub_id} (Header: John Doe, Roll: 1042, Class: 10-A)")

    # 8. Create Evaluations (Simulated or Real AI)
    eval1 = QuestionEvaluation(
        submission_id=sub_id,
        question_id=q1["id"],
        question_no="1",
        transcribed_answer="Given equation: 3x + 7 = 22\n3x = 15\nx = 5\nAnswer: x = 5",
        page_numbers=[1],
        ai_marks=2.0,
        final_marks=2.0,
        max_marks=2.0,
        key_points_matched=["Subtract 7 to get 15", "x = 5"],
        key_points_missed=[],
        mistakes=[],
        feedback="Flawless algebraic simplification.",
        confidence=0.98,
        is_flagged=False
    )
    eval2 = QuestionEvaluation(
        submission_id=sub_id,
        question_id=q2["id"],
        question_no="2",
        transcribed_answer="2^5 = 2 * 2 * 2 * 2 * 2 = 32.\nAnswer: 32",
        page_numbers=[1],
        ai_marks=1.0,
        final_marks=1.0,
        max_marks=1.0,
        key_points_matched=["32"],
        key_points_missed=[],
        mistakes=[],
        feedback="Accurate calculation.",
        confidence=0.99,
        is_flagged=False
    )
    eval3 = QuestionEvaluation(
        submission_id=sub_id,
        question_id=q3["id"],
        question_no="3",
        transcribed_answer="Draw line XY parallel to BC. Angle XAB = angle B, angle YAC = angle C. Straight line = 180 degrees => sum = 180 degrees. Proved.",
        page_numbers=[2],
        ai_marks=3.0,
        final_marks=3.0,
        max_marks=3.0,
        key_points_matched=["Auxiliary line", "Alternate interior angles", "Straight line angle sum"],
        key_points_missed=[],
        mistakes=[],
        feedback="Clear geometric proof with appropriate justification.",
        confidence=0.95,
        is_flagged=False
    )
    eval4 = QuestionEvaluation(
        submission_id=sub_id,
        question_id=q4["id"],
        question_no="4",
        transcribed_answer="Speed = Distance / Time = 240 / 4 = 60 km/h",
        page_numbers=[2],
        ai_marks=2.0,
        final_marks=2.0,
        max_marks=2.0,
        key_points_matched=["Speed formula", "60 km/h"],
        key_points_missed=[],
        mistakes=[],
        feedback="Correct formula and unit.",
        confidence=0.97,
        is_flagged=False
    )
    eval5 = QuestionEvaluation(
        submission_id=sub_id,
        question_id=q5["id"],
        question_no="5",
        transcribed_answer="In any right-angled triangle, hypotenuse squared equals sum of other two sides squared: a^2 + b^2 = c^2. Example: 3^2 + 4^2 = 9 + 16 = 25 = 5^2. LHS = RHS = 25.",
        page_numbers=[3],
        ai_marks=5.0,
        final_marks=5.0,
        max_marks=5.0,
        key_points_matched=["Theorem definition", "Formula a^2+b^2=c^2", "3^2+4^2 calculation", "Verification with 5^2=25"],
        key_points_missed=[],
        mistakes=[],
        feedback="Exemplary theorem statement and verification.",
        confidence=0.96,
        is_flagged=False
    )
    db.add_all([eval1, eval2, eval3, eval4, eval5])
    db.commit()
    print("[PASS] 8. All 5 questions evaluated across pages 1, 2, and 3 (Initial Total: 13.0/13.0)")

    # 9. Test Teacher Override
    override_res = client.put(f"/api/evaluations/{eval1.id}/marks", json={
        "final_marks": 1.5,
        "teacher_comment": "Deducted 0.5 for missing units in intermediate step"
    }, headers=headers)
    assert override_res.status_code == 200, f"Override failed: {override_res.text}"
    updated_eval = override_res.json()
    assert updated_eval["final_marks"] == 1.5
    assert updated_eval["is_overridden"] == True
    print(f"[PASS] 9. Teacher override: Q1 marks adjusted from 2.0 to 1.5 with comment")

    # 10. Audit Log verification
    audit_res = client.get(f"/api/submissions/{sub_id}/audit-log", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    assert logs[0]["action"] == "marks_override"
    print(f"[PASS] 10. Audit log verified: tracked action '{logs[0]['action']}' from {logs[0]['old_value']} to {logs[0]['new_value']}")

    # 11. Finalize Submission
    final_res = client.post(f"/api/submissions/{sub_id}/finalize", headers=headers)
    assert final_res.status_code == 200
    assert final_res.json()["status"] == "finalized"
    print("[PASS] 11. Submission approved and finalized")

    # 12. Report Generation & Downloads
    report_json = client.get(f"/api/submissions/{sub_id}/report", headers=headers)
    assert report_json.status_code == 200
    rep_data = report_json.json()
    assert rep_data["performance"]["total_marks"] == 12.5
    assert rep_data["performance"]["max_marks"] == 13.0
    assert rep_data["performance"]["percentage"] == 96.15
    assert rep_data["performance"]["grade"] == "A+"
    print(f"[PASS] 12. Report JSON verified: Total 12.5/13.0 (96.15%), Grade A+, Rank #{rep_data['performance']['rank']}")

    # 13. ReportLab PDF Generation
    db.expire_all()
    pdf_bytes = generate_submission_pdf(db, sub_id)
    assert len(pdf_bytes) > 1000, f"PDF bytes too small ({len(pdf_bytes)})"
    assert pdf_bytes.startswith(b"%PDF"), "Generated bytes not a valid PDF document"
    # Save a copy for artifact viewing
    with open("uploads/samples/sample_final_report.pdf", "wb") as f:
        f.write(pdf_bytes)
    print(f"[PASS] 13. Generated valid ReportLab PDF ({len(pdf_bytes)} bytes)")

    # 14. CSV Report Generation
    csv_str = generate_submission_csv(db, sub_id)
    assert "John Doe" in csv_str
    assert "1042" in csv_str
    assert "12.5" in csv_str
    print("[PASS] 14. Generated valid CSV student report")

    # 15. Exam Summary CSV
    exam_csv = generate_exam_csv(db, exam_id)
    assert "John Doe" in exam_csv
    assert "12.5" in exam_csv
    print("[PASS] 15. Generated valid Exam summary CSV")

    print("\nALL 15 END-TO-END TEST SUITE STEPS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_tests()
