"""PDF utilities – text and image extraction via PyMuPDF."""


def extract_text_from_pdf(file_path: str) -> list[str]:
    """
    Open a PDF and return a list of text strings, one per page.
    Uses fitz (PyMuPDF) for extraction.
    """
    raise NotImplementedError


def render_page_as_image(file_path: str, page_number: int, dpi: int = 150) -> bytes:
    """
    Render a single PDF page to PNG bytes at the given DPI.
    Useful for vision-capable Gemini requests.
    """
    raise NotImplementedError
