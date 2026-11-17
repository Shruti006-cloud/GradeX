"""Question extraction prompt."""

QUESTION_EXTRACTION_PROMPT = """You are an expert educator and exam analyzer.
Analyze the provided question paper image(s) and extract all questions into a clean structured format.

Extract EVERY question, preserving exact numbers and sub-parts.
For each question, determine:
- question_no: e.g. "1", "2", "3(a)", "3(b)", "4", etc.
- question_text: complete text of the question including any options for MCQs.
- max_marks: numerical maximum marks (float/int). If not explicitly printed, make a reasonable estimate based on typical exam structure (e.g., short questions 2-3 marks, long 5 marks).
- question_type: exactly one of "MCQ", "short", "long", "numerical".
- sub_parts: list of sub-part strings if any, or empty list.

Return ONLY a valid JSON object with NO markdown formatting, NO backticks, NO extra commentary:
{
  "questions": [
    {
      "question_no": "1",
      "question_text": "...",
      "max_marks": 2.0,
      "question_type": "short",
      "sub_parts": []
    }
  ]
}
"""
