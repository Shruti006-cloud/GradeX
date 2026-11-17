"""Answer key extraction prompt."""

ANSWER_KEY_EXTRACTION_PROMPT = """You are an expert educator and exam grader.
Analyze the provided Answer Key image(s) or document and map each solution to its corresponding question.

For each solution, extract:
- question_no: matching the question paper (e.g. "1", "2", "3(a)", etc.)
- model_answer: the complete ideal answer / solution steps.
- key_points: list of core key points or keywords that must be present in a student answer for full marks.
- marking_scheme: textual guidelines on how marks are distributed or partial credit rules.
- marks_split: dictionary of specific point/step -> marks awarded, or empty dict if not specified.

Return ONLY a valid JSON object with NO markdown formatting, NO backticks, NO extra commentary:
{
  "answer_keys": [
    {
      "question_no": "1",
      "model_answer": "...",
      "key_points": ["point 1", "point 2"],
      "marking_scheme": "1 mark for formula, 1 mark for final answer",
      "marks_split": {"formula": 1.0, "final_answer": 1.0}
    }
  ]
}
"""
