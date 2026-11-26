"""Word to PDF conversion endpoint."""

import asyncio
from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile

from app.core.config import Settings, get_settings
from app.services.word_to_pdf import WordConversionError, convert_word_to_pdf
from app.utils.concurrency import get_conversion_semaphore
from app.utils.temp_files import TempFileManager
from app.utils.validation import (
    FileValidationError,
    sanitize_filename_stem,
    validate_word_upload,
)

router = APIRouter(tags=["Word to PDF"])


@router.post("/word-to-pdf")
async def word_to_pdf_endpoint(
    request: Request,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> Response:
    """Convert a single uploaded DOC/DOCX file to a downloadable PDF document."""
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
        ext = validate_word_upload(
            filename=file.filename,
            content_type=file.content_type,
            data=data,
            max_size_mb=settings.max_file_size_mb,
        )
    except FileValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    temp_manager: TempFileManager = request.app.state.temp_manager
    job_dir = temp_manager.create_job_dir()
    input_path = job_dir / f"input{ext}"
    safe_stem = sanitize_filename_stem(file.filename)
    download_filename = f"{safe_stem}.pdf"
    semaphore = get_conversion_semaphore(settings.max_concurrent_conversions)

    try:
        input_path.write_bytes(data)

        async with semaphore:
            output_pdf = await asyncio.to_thread(
                convert_word_to_pdf,
                input_path,
                job_dir,
                settings.libreoffice_path,
                settings.conversion_timeout_seconds,
            )
        pdf_bytes = output_pdf.read_bytes()
    except MemoryError as exc:
        raise HTTPException(
            status_code=503,
            detail="Server memory limit reached while converting this Word document. Please try a smaller file.",
        ) from exc
    except WordConversionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while converting the Word document.",
        ) from exc
    finally:
        temp_manager.remove_job_dir(job_dir)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"',
        },
    )


@router.post("/word-preview")
async def word_preview_endpoint(
    request: Request,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> Response:
    """Generate an ephemeral PDF preview for a DOC/DOCX upload without saving permanently."""
    return await word_to_pdf_endpoint(request=request, file=file, settings=settings)
