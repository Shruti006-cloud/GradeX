"""Evaluation / marking prompt templates."""

EVALUATION_PROMPT_TEMPLATE = """\
You are an expert teacher evaluating a student's answer.

## Question
{question_text}

## Expected Answer / Marking Scheme
{expected_answer}

{marking_scheme_section}

## Student's Answer
{student_answer}

## Instructions
- Assess the student's answer strictly against the marking scheme.
- Award marks between 0 and {max_marks}.
- Provide brief, constructive feedback (2–4 sentences).
- Return ONLY valid JSON in this exact format:

{{
  "marks_awarded": <float>,
  "feedback": "<string>"
}}
"""


def build_evaluation_prompt(
    question_text: str,
    expected_answer: str,
    marking_scheme: str | None,
    student_answer: str,
    max_marks: float,
) -> str:
    """Render the evaluation prompt with the given values."""
    ms_section = f"## Marking Scheme\n{marking_scheme}" if marking_scheme else ""
    return EVALUATION_PROMPT_TEMPLATE.format(
        question_text=question_text,
        expected_answer=expected_answer,
        marking_scheme_section=ms_section,
        student_answer=student_answer,
        max_marks=max_marks,
    )
