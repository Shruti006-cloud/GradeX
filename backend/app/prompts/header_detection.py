"""Student header detection prompt."""

HEADER_DETECTION_PROMPT = """You are analyzing the header / top area of a student's answer sheet (page 1).
Inspect the handwriting or printed text for student identification information:
- Student Name
- Roll Number / Student ID / Registration No
- Class / Grade / Section

Return ONLY a valid JSON object with NO markdown formatting, NO backticks:
{
  "student_name": "detected name or null if not found",
  "roll_number": "detected roll/ID or null if not found",
  "class_name": "detected class/grade or null if not found",
  "confidence": 0.95
}
"""
