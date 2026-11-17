"""Report remarks and suggestions prompt."""

def build_report_remarks_prompt(
    student_name: str,
    subject: str,
    total_marks: float,
    max_total: float,
    percentage: float,
    evaluations_summary: list[dict],
) -> str:
    summary_text = ""
    for ev in evaluations_summary:
        summary_text += f"\n- Q{ev.get('question_no')}: {ev.get('marks_awarded')}/{ev.get('max_marks')} marks. Feedback: {ev.get('feedback', '')}"

    return f"""You are a caring and insightful academic counselor.
Generate an overall performance summary for a student with the following evaluation report:

Student Name: {student_name}
Subject: {subject}
Score: {total_marks} / {max_total} ({percentage}%)

Question Breakdown:
{summary_text}

Generate:
1. "strengths": list of 2-4 specific strong areas or topics the student mastered.
2. "weak_areas": list of 2-4 specific topics or skills where the student lost marks.
3. "overall_remark": a balanced, motivating paragraph (3-4 sentences) summarizing the student's performance.
4. "improvement_suggestions": list of 3-5 concrete, actionable study recommendations for the student to score higher next time.

Return ONLY a valid JSON object with NO markdown formatting, NO backticks:
{{
  "strengths": ["...", "..."],
  "weak_areas": ["...", "..."],
  "overall_remark": "...",
  "improvement_suggestions": ["...", "..."]
}}
"""
