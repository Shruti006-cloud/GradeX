"""Text extraction prompt templates (for image-based OCR via Gemini Vision)."""

EXTRACTION_PROMPT = """\
You are an OCR assistant. The image shows a page of a handwritten or typed student exam paper.

Extract all written text exactly as it appears.
Preserve the structure — keep question numbers and answers in order.
Return only the extracted text, with no commentary.
"""


def build_extraction_prompt() -> str:
    """Return the OCR extraction prompt."""
    return EXTRACTION_PROMPT
