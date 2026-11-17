"""Report service – PDF and CSV generation with ReportLab, rank calculation, and metrics."""
import io
import csv
import ast
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

from app.models.student_submission import StudentSubmission
from app.models.question_evaluation import QuestionEvaluation
from app.models.question import Question
from app.models.exam import Exam
from app.models.audit_log import AuditLog
from app.utils.grade_utils import recompute_total, compute_percentage, compute_grade


def compute_student_rank(db: Session, submission: StudentSubmission) -> int:
    """Calculate 1-based rank of student among all submissions for this exam."""
    all_subs = db.query(StudentSubmission).filter(
        StudentSubmission.exam_id == submission.exam_id,
        StudentSubmission.submission_status.in_(["evaluated", "reviewed", "finalized"])
    ).all()

    scores = []
    for s in all_subs:
        evals = db.query(QuestionEvaluation).filter(QuestionEvaluation.submission_id == s.id).all()
        tot = recompute_total(evals)
        scores.append((s.id, tot))

    # Sort descending by score
    scores.sort(key=lambda x: x[1], reverse=True)
    for rank, (s_id, _) in enumerate(scores, start=1):
        if s_id == submission.id:
            return rank
    return 1


def get_report_data(db: Session, submission_id: int) -> Dict[str, Any]:
    """Assemble all structured data needed for the student report."""
    sub = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not sub:
        raise ValueError(f"Submission {submission_id} not found")

    exam = db.query(Exam).filter(Exam.id == sub.exam_id).first()
    questions = db.query(Question).filter(Question.exam_id == exam.id).order_by(Question.order_index).all()
    evals = db.query(QuestionEvaluation).filter(QuestionEvaluation.submission_id == sub.id).all()
    eval_map = {e.question_id: e for e in evals}

    total_awarded = recompute_total(evals)
    max_total = sum(q.max_marks for q in questions) if questions else (exam.total_marks or 0.0)
    pct = compute_percentage(total_awarded, max_total)
    grade = compute_grade(pct)
    rank = compute_student_rank(db, sub)

    # Get latest remarks from audit log if generated
    remarks_log = db.query(AuditLog).filter(
        AuditLog.submission_id == sub.id,
        AuditLog.action == "remarks_generated"
    ).order_by(AuditLog.timestamp.desc()).first()

    strengths = []
    weak_areas = []
    overall_remark = "Good attempt. Continue practicing core problem areas."
    improvement_suggestions = []

    if remarks_log and remarks_log.new_value:
        try:
            parsed_remarks = ast.literal_eval(remarks_log.new_value)
            if isinstance(parsed_remarks, dict):
                strengths = parsed_remarks.get("strengths", [])
                weak_areas = parsed_remarks.get("weak_areas", [])
                overall_remark = parsed_remarks.get("overall_remark", overall_remark)
                improvement_suggestions = parsed_remarks.get("improvement_suggestions", [])
        except Exception:
            pass

    q_breakdown = []
    for q in questions:
        e = eval_map.get(q.id)
        q_breakdown.append({
            "question_no": q.question_no,
            "question_text": q.question_text,
            "max_marks": q.max_marks,
            "ai_marks": e.ai_marks if e else 0.0,
            "final_marks": e.final_marks if e else 0.0,
            "is_overridden": e.is_overridden if e else False,
            "teacher_comment": e.teacher_comment if e else "",
            "transcribed_answer": e.transcribed_answer if e else "N/A",
            "feedback": e.feedback if e else "",
            "key_points_matched": e.key_points_matched if e else [],
            "key_points_missed": e.key_points_missed if e else [],
        })

    return {
        "student": {
            "name": sub.student_name or sub.ai_detected_name or "Unknown Student",
            "roll_number": sub.roll_number or sub.ai_detected_roll or "N/A",
            "class_name": sub.class_name or exam.class_name or "N/A",
            "status": sub.submission_status,
        },
        "exam": {
            "id": exam.id,
            "title": exam.title,
            "subject": exam.subject,
            "class_name": exam.class_name,
            "total_marks": max_total,
        },
        "performance": {
            "total_marks": total_awarded,
            "max_marks": max_total,
            "percentage": pct,
            "grade": grade,
            "rank": rank,
        },
        "questions": q_breakdown,
        "strengths": strengths,
        "weak_areas": weak_areas,
        "overall_remark": overall_remark,
        "improvement_suggestions": improvement_suggestions,
    }


def generate_submission_pdf(db: Session, submission_id: int) -> bytes:
    """Generate professional PDF student evaluation report using ReportLab."""
    data = get_report_data(db, submission_id)
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=12,
    )
    heading2_style = ParagraphStyle(
        "DocHeading2",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#334155"),
        spaceBefore=10,
        spaceAfter=6,
    )
    normal_style = ParagraphStyle(
        "DocNormal",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    bold_style = ParagraphStyle(
        "DocBold",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#1e293b"),
    )

    elements = []

    # Header
    elements.append(Paragraph("AI Examiner – Performance Report", title_style))
    elements.append(Paragraph(f"Official Automated Academic Assessment & Feedback", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4f46e5"), spaceAfter=12))

    # Student & Exam Info Table
    perf = data["performance"]
    student = data["student"]
    exam = data["exam"]

    info_data = [
        [
            Paragraph("<b>Student Name:</b>", normal_style),
            Paragraph(student["name"], bold_style),
            Paragraph("<b>Exam Title:</b>", normal_style),
            Paragraph(exam["title"], bold_style),
        ],
        [
            Paragraph("<b>Roll / ID:</b>", normal_style),
            Paragraph(student["roll_number"], normal_style),
            Paragraph("<b>Subject:</b>", normal_style),
            Paragraph(exam["subject"] or "N/A", normal_style),
        ],
        [
            Paragraph("<b>Class / Grade:</b>", normal_style),
            Paragraph(student["class_name"], normal_style),
            Paragraph("<b>Class Rank:</b>", normal_style),
            Paragraph(f"#{perf['rank']}", bold_style),
        ],
        [
            Paragraph("<b>Total Score:</b>", normal_style),
            Paragraph(f"<b>{perf['total_marks']} / {perf['max_marks']}</b> ({perf['percentage']}%)", bold_style),
            Paragraph("<b>Final Grade:</b>", normal_style),
            Paragraph(f"<b>{perf['grade']}</b>", bold_style),
        ],
    ]

    info_table = Table(info_data, colWidths=[90, 180, 90, 180])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 14))

    # Question-wise Breakdown
    elements.append(Paragraph("Question-Wise Evaluation Breakdown", heading2_style))

    q_table_data = [
        [
            Paragraph("<b>Q#</b>", normal_style),
            Paragraph("<b>Question</b>", normal_style),
            Paragraph("<b>Max</b>", normal_style),
            Paragraph("<b>AI Marks</b>", normal_style),
            Paragraph("<b>Final Marks</b>", normal_style),
            Paragraph("<b>Feedback</b>", normal_style),
        ]
    ]

    for q in data["questions"]:
        override_mark = " (Overridden)" if q["is_overridden"] else ""
        marks_display = f"{q['final_marks']}{override_mark}"
        q_table_data.append([
            Paragraph(str(q["question_no"]), normal_style),
            Paragraph(q["question_text"][:80] + ("..." if len(q["question_text"]) > 80 else ""), normal_style),
            Paragraph(str(q["max_marks"]), normal_style),
            Paragraph(str(q["ai_marks"]), normal_style),
            Paragraph(marks_display, bold_style if q["is_overridden"] else normal_style),
            Paragraph(q["feedback"][:120] + ("..." if len(q["feedback"]) > 120 else ""), normal_style),
        ])

    q_table = Table(q_table_data, colWidths=[35, 145, 35, 45, 60, 220])
    q_table_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e7ff")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]

    # Highlight overridden rows in subtle amber
    for r_idx, q in enumerate(data["questions"], start=1):
        if q["is_overridden"]:
            q_table_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), colors.HexColor("#fef3c7")))

    q_table.setStyle(TableStyle(q_table_style))
    elements.append(q_table)
    elements.append(Spacer(1, 14))

    # Overall Remark & Feedback Section
    elements.append(Paragraph("Overall Performance Remark", heading2_style))
    elements.append(Paragraph(data["overall_remark"], normal_style))
    elements.append(Spacer(1, 10))

    if data["strengths"]:
        elements.append(Paragraph("<b>Key Strengths:</b>", bold_style))
        for st in data["strengths"]:
            elements.append(Paragraph(f"• {st}", normal_style))
        elements.append(Spacer(1, 6))

    if data["weak_areas"]:
        elements.append(Paragraph("<b>Areas for Improvement:</b>", bold_style))
        for wa in data["weak_areas"]:
            elements.append(Paragraph(f"• {wa}", normal_style))
        elements.append(Spacer(1, 6))

    if data["improvement_suggestions"]:
        elements.append(Paragraph("<b>Actionable Study Recommendations:</b>", bold_style))
        for sugg in data["improvement_suggestions"]:
            elements.append(Paragraph(f"• {sugg}", normal_style))
        elements.append(Spacer(1, 6))

    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94a3b8"), spaceBefore=16, spaceAfter=8))
    elements.append(Paragraph("Generated by AI Examiner – Automated Evaluation with Teacher Review", subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def generate_submission_csv(db: Session, submission_id: int) -> str:
    """Generate CSV report for one submission."""
    data = get_report_data(db, submission_id)
    output = io.StringIO()
    writer = csv.writer(output)

    # Header info
    writer.writerow(["AI EXAMINER - STUDENT PERFORMANCE REPORT"])
    writer.writerow(["Student Name", data["student"]["name"]])
    writer.writerow(["Roll Number", data["student"]["roll_number"]])
    writer.writerow(["Class", data["student"]["class_name"]])
    writer.writerow(["Exam Title", data["exam"]["title"]])
    writer.writerow(["Subject", data["exam"]["subject"]])
    writer.writerow(["Total Score", data["performance"]["total_marks"]])
    writer.writerow(["Max Marks", data["performance"]["max_marks"]])
    writer.writerow(["Percentage", f"{data['performance']['percentage']}%"])
    writer.writerow(["Grade", data["performance"]["grade"]])
    writer.writerow(["Rank", f"#{data['performance']['rank']}"])
    writer.writerow([])

    # Question table
    writer.writerow(["Question No", "Max Marks", "AI Marks", "Final Marks", "Teacher Overridden", "Feedback", "Transcribed Answer"])
    for q in data["questions"]:
        writer.writerow([
            q["question_no"],
            q["max_marks"],
            q["ai_marks"],
            q["final_marks"],
            "Yes" if q["is_overridden"] else "No",
            q["feedback"],
            q["transcribed_answer"],
        ])

    return output.getvalue()


def generate_exam_csv(db: Session, exam_id: int) -> str:
    """Generate summary CSV of all students in an exam with question-wise marks."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise ValueError(f"Exam {exam_id} not found")

    questions = db.query(Question).filter(Question.exam_id == exam_id).order_by(Question.order_index).all()
    submissions = db.query(StudentSubmission).filter(StudentSubmission.exam_id == exam_id).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Columns: Student Name, Roll No, Class, Status, Q1, Q2, ..., Total, Max Marks, %, Grade
    q_cols = [f"Q{q.question_no} (/{q.max_marks})" for q in questions]
    header = ["Student Name", "Roll Number", "Class", "Status"] + q_cols + ["Total Marks", "Max Marks", "Percentage", "Grade"]
    writer.writerow(header)

    max_exam_marks = sum(q.max_marks for q in questions) if questions else (exam.total_marks or 0.0)

    for sub in submissions:
        evals = db.query(QuestionEvaluation).filter(QuestionEvaluation.submission_id == sub.id).all()
        eval_map = {e.question_id: e for e in evals}
        tot = recompute_total(evals)
        pct = compute_percentage(tot, max_exam_marks)
        grade = compute_grade(pct)

        row = [
            sub.student_name or sub.ai_detected_name or "Unknown",
            sub.roll_number or sub.ai_detected_roll or "N/A",
            sub.class_name or exam.class_name or "N/A",
            sub.submission_status,
        ]

        for q in questions:
            ev = eval_map.get(q.id)
            row.append(ev.final_marks if ev is not None else 0.0)

        row.extend([tot, max_exam_marks, f"{pct}%", grade])
        writer.writerow(row)

    return output.getvalue()
