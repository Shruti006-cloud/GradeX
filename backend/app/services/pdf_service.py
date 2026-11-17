"""PDF to image conversion using PyMuPDF (fitz)."""
import os


def convert_pdf_to_images(
    pdf_path: str, output_dir: str, dpi: int = 200
) -> list[str]:
    """
    Convert each page of a PDF to a JPEG image.
    Returns a list of absolute image file paths.
    """
    import fitz  # PyMuPDF

    os.makedirs(output_dir, exist_ok=True)
    image_paths: list[str] = []

    doc = fitz.open(pdf_path)
    zoom = dpi / 72.0  # 72 DPI is fitz default
    mat = fitz.Matrix(zoom, zoom)

    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_filename = f"page_{page_num + 1:04d}.jpg"
        img_path = os.path.join(output_dir, img_filename)
        pix.save(img_path, output="jpeg")
        image_paths.append(img_path)

    doc.close()
    return image_paths
