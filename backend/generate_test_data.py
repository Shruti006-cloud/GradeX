"""Script to generate realistic test PDFs for AI Examiner:
1. Question Paper
2. Answer Key
3. 3-Page Student Answer Sheet
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, PageBreak

def create_question_paper(path: str):
    doc = SimpleDocTemplate(path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, leading=22, alignment=1)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=11, leading=14, alignment=1, textColor=colors.gray)
    q_style = ParagraphStyle('Q', parent=styles['Normal'], fontSize=12, leading=16, spaceBefore=12)

    elements = [
        Paragraph("Springfield High School", title_style),
        Paragraph("Mid-Term Examination — Mathematics | Grade 10-A", subtitle_style),
        Paragraph("Time: 1 Hour | Total Marks: 13", subtitle_style),
        HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=8, spaceAfter=14),
        Paragraph("<b>Question 1 (2 Marks, Numerical):</b><br/>Solve for x: 3x + 7 = 22. Show all calculation steps.", q_style),
        Paragraph("<b>Question 2 (1 Mark, Short):</b><br/>Calculate the exact value of 2<sup>5</sup>.", q_style),
        Paragraph("<b>Question 3 (3 Marks, Short):</b><br/>Prove that the sum of angles in a triangle is 180 degrees. State the geometric properties used.", q_style),
        Paragraph("<b>Question 4 (2 Marks, Numerical):</b><br/>A train travels 240 kilometers in 4 hours. Calculate its average speed in km/h.", q_style),
        Paragraph("<b>Question 5 (5 Marks, Long):</b><br/>State the Pythagorean theorem and illustrate it with a right-angled triangle example with side lengths 3, 4, and 5.", q_style),
    ]
    doc.build(elements)
    print(f"Created Question Paper at: {path}")


def create_answer_key(path: str):
    doc = SimpleDocTemplate(path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, leading=20)
    ak_style = ParagraphStyle('AK', parent=styles['Normal'], fontSize=11, leading=15, spaceBefore=10)

    elements = [
        Paragraph("Official Answer Key & Marking Scheme", title_style),
        HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=6, spaceAfter=12),
        Paragraph("<b>Question 1 (2 Marks):</b><br/>Model Answer: 3x + 7 = 22 => 3x = 15 => x = 5.<br/>Key Points: Subtract 7 to get 15 (1 mark), divide by 3 to get x = 5 (1 mark).", ak_style),
        Paragraph("<b>Question 2 (1 Mark):</b><br/>Model Answer: 2^5 = 32.<br/>Key Points: Exact value 32 (1 mark).", ak_style),
        Paragraph("<b>Question 3 (3 Marks):</b><br/>Model Answer: Draw line parallel to base through vertex. Alternate interior angles are equal. The angles on a straight line add to 180 degrees, so angle A + B + C = 180.<br/>Key Points: Parallel auxiliary line (1 mark), alternate interior angles equality (1 mark), straight line 180 degree property (1 mark).", ak_style),
        Paragraph("<b>Question 4 (2 Marks):</b><br/>Model Answer: Speed = Distance / Time = 240 km / 4 h = 60 km/h.<br/>Key Points: Formula Speed = Distance/Time (1 mark), correct calculation 60 km/h with unit (1 mark).", ak_style),
        Paragraph("<b>Question 5 (5 Marks):</b><br/>Model Answer: In a right triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: a^2 + b^2 = c^2. For sides 3, 4, 5: 3^2 + 4^2 = 9 + 16 = 25. Hypotenuse 5^2 = 25. Since 25 = 25, the theorem is verified.<br/>Key Points: Formal theorem statement (2 marks), formula a^2 + b^2 = c^2 (1 mark), calculation 3^2+4^2=25 (1 mark), verification 5^2=25 (1 mark).", ak_style),
    ]
    doc.build(elements)
    print(f"Created Answer Key at: {path}")


def create_student_answer_sheet(path: str):
    doc = SimpleDocTemplate(path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    header_title = ParagraphStyle('HTitle', parent=styles['Heading2'], fontSize=14, leading=18, alignment=1)
    header_info = ParagraphStyle('HInfo', parent=styles['Normal'], fontSize=11, leading=14, alignment=1)
    ans_style = ParagraphStyle('Ans', parent=styles['Normal'], fontSize=12, leading=17, spaceBefore=12)

    elements = [
        # PAGE 1: Header + Q1 + Q2
        Paragraph("STUDENT ANSWER SHEET", header_title),
        Paragraph("<b>Student Name:</b> John Doe &nbsp;&nbsp;&nbsp;&nbsp; <b>Roll Number:</b> 1042 &nbsp;&nbsp;&nbsp;&nbsp; <b>Class:</b> 10-A", header_info),
        Paragraph("<b>Subject:</b> Mathematics &nbsp;&nbsp;&nbsp;&nbsp; <b>Date:</b> November 15, 2026", header_info),
        HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=8, spaceAfter=16),
        Paragraph("<b>Ans 1:</b><br/>Given equation: 3x + 7 = 22<br/>Subtracting 7 from both sides:<br/>3x = 22 - 7<br/>3x = 15<br/>Dividing by 3:<br/>x = 15 / 3<br/><b>x = 5</b><br/>Answer: x = 5.", ans_style),
        Spacer(1, 16),
        Paragraph("<b>Ans 2:</b><br/>2^5 = 2 * 2 * 2 * 2 * 2 = 32.<br/><b>Answer: 32</b>", ans_style),
        PageBreak(),

        # PAGE 2: Q3 + Q4
        Paragraph("<b>Ans 3:</b><br/>To prove: Sum of interior angles of a triangle ABC = 180 degrees.<br/>Proof:<br/>1. Draw a line XY parallel to side BC passing through vertex A.<br/>2. By alternate interior angle theorem, angle XAB = angle B, and angle YAC = angle C.<br/>3. Since XAY is a straight line, the sum of angles on a straight line is 180 degrees:<br/>angle XAB + angle BAC + angle YAC = 180 degrees.<br/>4. Substituting angle B and angle C:<br/>angle B + angle A + angle C = 180 degrees.<br/>Hence proved.", ans_style),
        Spacer(1, 20),
        Paragraph("<b>Ans 4:</b><br/>Given:<br/>Total Distance = 240 km<br/>Total Time = 4 hours<br/>Speed = Distance / Time<br/>Speed = 240 / 4<br/><b>Speed = 60 km/h</b>", ans_style),
        PageBreak(),

        # PAGE 3: Q5
        Paragraph("<b>Ans 5:</b><br/><b>Pythagorean Theorem:</b><br/>In any right-angled triangle, the area of the square whose side is the hypotenuse is equal to the sum of the areas of the squares on the other two legs.<br/>Formula: a^2 + b^2 = c^2, where c is the hypotenuse.<br/><br/><b>Example:</b><br/>Consider a right triangle with legs a = 3 cm, b = 4 cm, and hypotenuse c = 5 cm.<br/>LHS = a^2 + b^2 = 3^2 + 4^2 = 9 + 16 = 25<br/>RHS = c^2 = 5^2 = 25<br/>Since LHS = RHS (25 = 25), the Pythagorean theorem holds true.", ans_style),
    ]
    doc.build(elements)
    print(f"Created Student Answer Sheet (3 Pages) at: {path}")

if __name__ == "__main__":
    os.makedirs("uploads/samples", exist_ok=True)
    create_question_paper("uploads/samples/sample_question_paper.pdf")
    create_answer_key("uploads/samples/sample_answer_key.pdf")
    create_student_answer_sheet("uploads/samples/sample_student_answer_sheet.pdf")
