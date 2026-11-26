"""PDF to Word conversion service using PyMuPDF pre-checks and pdf2docx."""

from pathlib import Path
import pymupdf
from pdf2docx import Converter


class PdfConversionError(Exception):
    """Raised when a PDF cannot be converted to DOCX."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def _inspect_pdf(input_path: Path) -> None:
    """Inspect PDF readability, encryption, and whether it is scanned/image-only."""
    try:
        doc = pymupdf.open(stream=input_path.read_bytes(), filetype="pdf")
    except Exception as exc:
        raise PdfConversionError(
            400,
            "The PDF file appears to be corrupted or unreadable.",
        ) from exc

    try:
        if doc.needs_pass:
            raise PdfConversionError(
                400,
                "Password-protected PDFs are not supported. Please unlock the PDF and try again.",
            )

        if doc.page_count == 0:
            raise PdfConversionError(
                400,
                "The PDF file contains no pages.",
            )

        total_text_chars = 0
        has_images = False
        for page in doc:
            total_text_chars += len(page.get_text("text").strip())
            if not has_images and page.get_images(full=True):
                has_images = True
            if total_text_chars > 0:
                break

        if total_text_chars == 0 and has_images:
            raise PdfConversionError(
                422,
                "This PDF appears to be scanned or image-only. OCR is not currently supported.",
            )

        if total_text_chars == 0 and not has_images:
            raise PdfConversionError(
                422,
                "This PDF contains no extractable text or content to convert.",
            )
    finally:
        doc.close()


def convert_pdf_to_word(input_path: Path, output_path: Path) -> Path:
    """Convert a validated PDF file into a DOCX document."""
    _inspect_pdf(input_path)

    converter: Converter | None = None
    try:
        converter = Converter(str(input_path))
        converter.convert(str(output_path))
    except PdfConversionError:
        raise
    except Exception as exc:
        raise PdfConversionError(
            500,
            "Failed to convert this PDF to Word. The document structure may be unsupported or damaged.",
        ) from exc
    finally:
        if converter is not None:
            try:
                converter.close()
            except Exception:
                pass

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise PdfConversionError(
            500,
            "Conversion produced an empty output file.",
        )

    return output_path
