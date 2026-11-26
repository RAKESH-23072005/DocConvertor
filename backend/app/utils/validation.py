"""File validation and path-sanitization utilities for DocConvertor."""

import io
import re
import zipfile
from pathlib import Path

ALLOWED_EXTENSIONS: dict[str, set[str]] = {
    "pdf-to-word": {".pdf"},
    "word-to-pdf": {".doc", ".docx"},
    "compress-pdf": {".pdf"},
    "compress-image": {".jpg", ".jpeg", ".png", ".webp"},
}

ALLOWED_PDF_MIME_TYPES: set[str] = {
    "application/pdf",
    "application/x-pdf",
    "application/octet-stream",
}

ALLOWED_WORD_MIME_TYPES: set[str] = {
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
    "application/zip",
}

OLE2_MAGIC = b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"
ZIP_MAGIC = b"PK\x03\x04"


class FileValidationError(Exception):
    """Raised when an uploaded file fails validation."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def validate_file_extension(filename: str, tool_key: str) -> bool:
    """Check whether the filename extension is permitted for the given tool."""
    allowed = ALLOWED_EXTENSIONS.get(tool_key)
    if not allowed:
        return False
    return Path(filename).suffix.lower() in allowed


def validate_file_size(size_bytes: int, max_size_mb: int) -> bool:
    """Check whether the file size is within the configured limit."""
    return 0 < size_bytes <= max_size_mb * 1024 * 1024


def sanitize_filename_stem(filename: str | None) -> str:
    """Extract a safe filename stem, preventing path traversal."""
    if not filename:
        return "document"
    base = Path(filename.replace("\\", "/")).name
    stem = Path(base).stem
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._-")
    return safe[:100] or "document"


def validate_pdf_upload(
    filename: str | None,
    content_type: str | None,
    data: bytes,
    max_size_mb: int,
) -> None:
    """Validate an uploaded PDF file's extension, MIME type, size, and signature."""
    if not filename or not validate_file_extension(filename, "pdf-to-word"):
        raise FileValidationError(
            400, "Invalid file type. Only PDF (.pdf) files are supported."
        )

    normalized_mime = (content_type or "").split(";")[0].strip().lower()
    if normalized_mime and normalized_mime not in ALLOWED_PDF_MIME_TYPES:
        raise FileValidationError(
            400,
            f"Unsupported MIME type '{normalized_mime}'. Please upload a valid PDF file.",
        )

    if len(data) == 0:
        raise FileValidationError(400, "The uploaded PDF file is empty (0 bytes).")

    if len(data) > max_size_mb * 1024 * 1024:
        raise FileValidationError(
            413,
            f"File exceeds the maximum allowed size of {max_size_mb} MB.",
        )

    if not data.startswith(b"%PDF-"):
        raise FileValidationError(
            400,
            "Invalid or corrupted PDF file (missing %PDF- signature).",
        )


def validate_word_upload(
    filename: str | None,
    content_type: str | None,
    data: bytes,
    max_size_mb: int,
) -> str:
    """Validate an uploaded DOC/DOCX file and return its lowercase extension."""
    if not filename or not validate_file_extension(filename, "word-to-pdf"):
        raise FileValidationError(
            400, "Invalid file type. Only Word (.doc, .docx) files are supported."
        )

    ext = Path(filename).suffix.lower()
    normalized_mime = (content_type or "").split(";")[0].strip().lower()
    if normalized_mime and normalized_mime not in ALLOWED_WORD_MIME_TYPES:
        raise FileValidationError(
            400,
            f"Unsupported MIME type '{normalized_mime}'. Please upload a valid DOC or DOCX file.",
        )

    if len(data) == 0:
        raise FileValidationError(400, "The uploaded Word file is empty (0 bytes).")

    if len(data) > max_size_mb * 1024 * 1024:
        raise FileValidationError(
            413,
            f"File exceeds the maximum allowed size of {max_size_mb} MB.",
        )

    if ext == ".docx":
        if not data.startswith(ZIP_MAGIC):
            raise FileValidationError(
                400,
                "Invalid or corrupted DOCX file (missing ZIP archive signature).",
            )
        try:
            with zipfile.ZipFile(io.BytesIO(data), "r") as zf:
                names = set(zf.namelist())
                if "word/document.xml" not in names and "[Content_Types].xml" not in names:
                    raise FileValidationError(
                        400,
                        "The uploaded DOCX file is missing required Word document entries.",
                    )
        except FileValidationError:
            raise
        except Exception as exc:
            raise FileValidationError(
                400,
                "The uploaded DOCX file is corrupted or unreadable.",
            ) from exc
    elif ext == ".doc":
        if not (data.startswith(OLE2_MAGIC) or data.lstrip().startswith(b"{\\rtf")):
            raise FileValidationError(
                400,
                "Invalid or corrupted DOC file (unrecognized binary document signature).",
            )

    return ext
