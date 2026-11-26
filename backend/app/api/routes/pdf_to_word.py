"""PDF to Word conversion endpoint."""

import asyncio
from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile

from app.core.config import Settings, get_settings
from app.services.pdf_to_word import PdfConversionError, convert_pdf_to_word
from app.utils.concurrency import get_conversion_semaphore
from app.utils.temp_files import TempFileManager
from app.utils.validation import (
    FileValidationError,
    sanitize_filename_stem,
    validate_pdf_upload,
)

router = APIRouter(tags=["PDF to Word"])

DOCX_MIME_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


@router.post("/pdf-to-word")
async def pdf_to_word_endpoint(
    request: Request,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> Response:
    """Convert a single uploaded PDF file to a downloadable DOCX document."""
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    chunks: list[bytes] = []
    total_size = 0

    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds the maximum allowed size of {settings.max_file_size_mb} MB.",
            )
        chunks.append(chunk)

    data = b"".join(chunks)

    try:
        validate_pdf_upload(
            filename=file.filename,
            content_type=file.content_type,
            data=data,
            max_size_mb=settings.max_file_size_mb,
        )
    except FileValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    temp_manager: TempFileManager = request.app.state.temp_manager
    job_dir = temp_manager.create_job_dir()
    input_path = job_dir / "input.pdf"
    output_path = job_dir / "output.docx"
    safe_stem = sanitize_filename_stem(file.filename)
    download_filename = f"{safe_stem}.docx"
    semaphore = get_conversion_semaphore(settings.max_concurrent_conversions)

    try:
        input_path.write_bytes(data)

        async with semaphore:
            await asyncio.wait_for(
                asyncio.to_thread(convert_pdf_to_word, input_path, output_path),
                timeout=settings.conversion_timeout_seconds,
            )
        docx_bytes = output_path.read_bytes()
    except asyncio.TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail="PDF conversion timed out. Please try a smaller or simpler document.",
        ) from exc
    except MemoryError as exc:
        raise HTTPException(
            status_code=503,
            detail="Server memory limit reached while converting this PDF. Please try a smaller document.",
        ) from exc
    except PdfConversionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while converting the PDF.",
        ) from exc
    finally:
        temp_manager.remove_job_dir(job_dir)

    return Response(
        content=docx_bytes,
        media_type=DOCX_MIME_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"',
        },
    )
