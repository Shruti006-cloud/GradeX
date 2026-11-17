"""Model answer & marking scheme generation prompt (when teacher uploads no key)."""

def build_model_answer_generation_prompt(questions: list[dict], subject: str = "General", exam_title: str = "") -> str:
    questions_formatted = ""
    for q in questions:
        q_no = q.get("question_no", "")
        q_text = q.get("question_text", "")
        q_marks = q.get("max_marks", 1.0)
        q_type = q.get("question_type", "short")
        questions_formatted += f"\n- Question {q_no} ({q_marks} marks, {q_type}): {q_text}\n"

    return f"""You are a master teacher and subject matter expert in {subject}.
An exam titled "{exam_title}" has the following questions:

{questions_formatted}

For EVERY question above, generate an ideal, accurate, and pedagogical Model Answer and strict Marking Scheme.

Guidelines:
1. model_answer: clear, complete, and exemplary answer that would receive 100% marks.
2. key_points: list of mandatory key concepts, formulas, keywords, or reasoning steps required.
3. marking_scheme: explicit step-by-step mark breakdown that totals to exactly max_marks.
4. marks_split: dictionary mapping each step/point to its float marks value.

Return ONLY a valid JSON object with NO markdown formatting, NO backticks:
{{
  "answer_keys": [
    {{
      "question_no": "1",
      "model_answer": "...",
      "key_points": ["...", "..."],
      "marking_scheme": "...",
      "marks_split": {{"concept": 1.0, "explanation": 1.0}}
    }}
  ]
}}
"""
