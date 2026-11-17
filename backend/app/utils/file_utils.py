"""File utilities."""
import os
import shutil
from fastapi import HTTPException, UploadFile


def save_upload(upload_file: UploadFile, dest_dir: str) -> str:
    """Save an uploaded file to dest_dir, returning the full path."""
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, upload_file.filename)
    with open(dest_path, "wb") as out:
        shutil.copyfileobj(upload_file.file, out)
    return dest_path


def validate_file(
    upload_file: UploadFile,
    allowed_types: list[str],
    max_mb: float = 50.0,
) -> None:
    """Raise HTTPException 400 if file type or size is invalid."""
    # Check content type
    content_type = upload_file.content_type or ""
    if not any(t in content_type for t in allowed_types):
        raise HTTPException(
            status_code=400,
            detail=f"File type '{content_type}' not allowed. Allowed: {allowed_types}",
        )
    # Check size by seeking to end
    upload_file.file.seek(0, 2)
    size_bytes = upload_file.file.tell()
    upload_file.file.seek(0)
    if size_bytes > max_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File size {size_bytes / 1024 / 1024:.1f} MB exceeds limit {max_mb} MB",
        )
