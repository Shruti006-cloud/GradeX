"""Student answer transcription and grading prompt."""

def build_answer_grading_prompt(
    question_no: str,
    question_text: str,
    max_marks: float,
    model_answer: str = "",
    key_points: list[str] = None,
    marking_scheme: str = "",
    total_pages: int = 1,
) -> str:
    kp_str = "\n".join(f"- {kp}" for kp in (key_points or []))
    return f"""You are a fair, precise, and encouraging teacher evaluating a student's answer sheet images.

### QUESTION DETAILS
- Question No: {question_no}
- Question Text: {question_text}
- Maximum Marks: {max_marks}

### MODEL ANSWER / KEY
- Model Answer: {model_answer or "N/A"}
- Key Points Required:
{kp_str or "N/A"}
- Marking Scheme: {marking_scheme or "Award proportional partial credit for correct reasoning and partial steps."}

### INSTRUCTIONS:
1. Carefully scan the provided student answer sheet page images (1 to {total_pages}).
2. Locate the student's answer for Question {question_no}. The student might have written it anywhere, potentially across multiple pages or out of order.
3. Transcribe the student's actual handwritten or printed answer verbatim into `transcribed_answer`. If the question was not attempted, transcribe as "Not Attempted". If handwriting is illegible, transcribe what is readable and note "[unreadable handwriting]".
4. Record the 1-based page number(s) where this answer was found in `page_numbers` (e.g. [1] or [1, 2]). If not found, use [].
5. Evaluate fairly:
   - Award partial marks for partially correct answers and correct intermediate steps.
   - Ignore minor spelling or grammar mistakes unless it changes scientific/mathematical meaning.
   - NEVER invent or assume content that is not visibly on the student's paper.
   - marks_awarded MUST be between 0.0 and {max_marks}.
6. Identify matched key points in `key_points_matched` and missed key points in `key_points_missed`.
7. List any conceptual or calculation mistakes in `mistakes`.
8. Provide constructive feedback in `feedback`.
9. Set `confidence` (float between 0.0 and 1.0) reflecting your certainty in handwriting legibility and scoring accuracy. If handwriting is hard to read or student skipped, confidence should be lower (< 0.6).
10. Flagging: if not attempted, illegible, or confidence < 0.6, explain why in feedback.

Return ONLY a valid JSON object matching this EXACT schema (no markdown, no backticks, no extra text):
{{
  "question_no": "{question_no}",
  "transcribed_answer": "...",
  "page_numbers": [1],
  "marks_awarded": 0.0,
  "max_marks": {max_marks},
  "key_points_matched": ["..."],
  "key_points_missed": ["..."],
  "mistakes": ["..."],
  "feedback": "...",
  "confidence": 0.95
}}
"""
