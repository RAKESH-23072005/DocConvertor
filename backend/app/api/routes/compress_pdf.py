"""PDF compression endpoint."""

import asyncio
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile

from app.core.config import Settings, get_settings
from app.services.compress_pdf import (
    SUPPORTED_COMPRESSION_LEVELS,
    PdfCompressionError,
    compress_pdf_document,
)
from app.utils.concurrency import get_conversion_semaphore
from app.utils.temp_files import TempFileManager
from app.utils.validation import (
    FileValidationError,
    sanitize_filename_stem,
    validate_pdf_upload,
)

router = APIRouter(tags=["Compress PDF"])


@router.post("/compress-pdf")
async def compress_pdf_endpoint(
    request: Request,
    file: UploadFile = File(...),
    level: str = Form("recommended"),
    settings: Settings = Depends(get_settings),
) -> Response:
    """Compress a single uploaded PDF file and return the optimized PDF with size headers."""
    normalized_level = level.strip().lower()
    if normalized_level not in SUPPORTED_COMPRESSION_LEVELS:
        raise HTTPException(
            status_code=400,
            detail="Invalid compression level. Supported values: recommended, high, maximum.",
        )

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
    safe_stem = sanitize_filename_stem(file.filename)
    download_filename = f"{safe_stem}-compressed.pdf"
    semaphore = get_conversion_semaphore(settings.max_concurrent_conversions)

    try:
        input_path.write_bytes(data)

        async with semaphore:
            result = await asyncio.to_thread(
                compress_pdf_document,
                input_path,
                job_dir,
                normalized_level,
                settings.ghostscript_path,
                settings.conversion_timeout_seconds,
            )
        pdf_bytes = result.output_path.read_bytes()
    except MemoryError as exc:
        raise HTTPException(
            status_code=503,
            detail="Server memory limit reached while compressing this PDF. Please try a smaller file.",
        ) from exc
    except PdfCompressionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while compressing the PDF.",
        ) from exc
    finally:
        temp_manager.remove_job_dir(job_dir)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"',
            "X-Original-Size": str(result.original_size),
            "X-Compressed-Size": str(result.compressed_size),
            "X-Saved-Percent": str(result.saved_percent),
            "X-Compression-Level": normalized_level,
            "X-Preserved-Original": "true" if result.preserved_original else "false",
        },
    )
