"""PDF compression service using pikepdf (lossless) and Ghostscript (downsampling)."""

import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
import pikepdf

SUPPORTED_COMPRESSION_LEVELS = {"recommended", "high", "maximum"}


class PdfCompressionError(Exception):
    """Raised when a PDF cannot be compressed."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


@dataclass
class PdfCompressionResult:
    output_path: Path
    original_size: int
    compressed_size: int
    saved_percent: int
    preserved_original: bool


def find_ghostscript_executable(configured_path: str | None = None) -> str:
    """Locate the Ghostscript CLI executable across Windows and Linux."""
    candidates: list[str] = []

    if configured_path and configured_path.strip():
        candidates.append(configured_path.strip())

    env_override = os.environ.get("GHOSTSCRIPT_PATH", "").strip()
    if env_override:
        candidates.append(env_override)

    for cmd in ("gswin64c", "gswin32c", "gs"):
        resolved = shutil.which(cmd)
        if resolved:
            candidates.append(resolved)

    # User-level Ghostscript install and standard Program Files / Linux paths
    user_gs = Path.home() / "gs" / "bin" / "gswin64c.exe"
    candidates.append(str(user_gs))

    for base_pf in (Path(r"C:\Program Files\gs"), Path(r"C:\Program Files (x86)\gs")):
        if base_pf.is_dir():
            for bin_exe in sorted(base_pf.glob("*/bin/gswin64c.exe"), reverse=True):
                candidates.append(str(bin_exe))

    candidates.extend(["/usr/bin/gs", "/usr/local/bin/gs"])

    for candidate in candidates:
        if Path(candidate).is_file():
            return candidate

    raise PdfCompressionError(
        503,
        "Ghostscript is not installed or could not be located on the server.",
    )


def _is_valid_pdf_file(path: Path) -> bool:
    if not path.is_file() or path.stat().st_size == 0:
        return False
    try:
        with path.open("rb") as fh:
            if fh.read(5) != b"%PDF-":
                return False
        with pikepdf.open(path) as pdf:
            return len(pdf.pages) > 0
    except Exception:
        return False


def _run_pikepdf_lossless(input_path: Path, output_path: Path) -> Path | None:
    """Apply lossless stream and object-stream compression via pikepdf."""
    try:
        with pikepdf.open(input_path) as pdf:
            if len(pdf.pages) == 0:
                raise PdfCompressionError(400, "The uploaded PDF contains no pages.")
            pdf.remove_unreferenced_resources()
            pdf.save(
                output_path,
                compress_streams=True,
                object_stream_mode=pikepdf.ObjectStreamMode.generate,
                recompress_flate=True,
            )
        return output_path if _is_valid_pdf_file(output_path) else None
    except pikepdf.PasswordError as exc:
        raise PdfCompressionError(
            400,
            "Password-protected PDFs are not supported. Please unlock the PDF and try again.",
        ) from exc
    except PdfCompressionError:
        raise
    except pikepdf.PdfError as exc:
        raise PdfCompressionError(
            400,
            "The uploaded PDF file appears to be corrupted or unreadable.",
        ) from exc
    except Exception:
        return None


def _build_gs_args(
    gs_exe: str, input_path: Path, output_path: Path, level: str
) -> list[str]:
    base = [
        gs_exe,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dSAFER",
        "-dDetectDuplicateImages=true",
        "-dCompressFonts=true",
        "-dSubsetFonts=true",
    ]

    if level == "recommended":
        tier_args = [
            "-dPDFSETTINGS=/ebook",
            "-dDownsampleColorImages=true",
            "-dColorImageResolution=150",
            "-dDownsampleGrayImages=true",
            "-dGrayImageResolution=150",
            "-dDownsampleMonoImages=true",
            "-dMonoImageResolution=300",
        ]
    elif level == "high":
        tier_args = [
            "-dPDFSETTINGS=/screen",
            "-dDownsampleColorImages=true",
            "-dColorImageResolution=110",
            "-dDownsampleGrayImages=true",
            "-dGrayImageResolution=110",
            "-dDownsampleMonoImages=true",
            "-dMonoImageResolution=200",
        ]
    else:  # maximum
        tier_args = [
            "-dPDFSETTINGS=/screen",
            "-dDownsampleColorImages=true",
            "-dColorImageResolution=72",
            "-dColorImageDownsampleType=/Bicubic",
            "-dAutoFilterColorImages=false",
            "-dColorImageFilter=/DCTEncode",
            "-dJPEGQ=55",
            "-dDownsampleGrayImages=true",
            "-dGrayImageResolution=72",
            "-dDownsampleMonoImages=true",
            "-dMonoImageResolution=150",
        ]

    return [*base, *tier_args, f"-sOutputFile={output_path}", str(input_path)]


def compress_pdf_document(
    input_path: Path,
    job_dir: Path,
    level: str = "recommended",
    ghostscript_path: str | None = None,
    timeout_seconds: int = 120,
) -> PdfCompressionResult:
    """Compress a PDF using pikepdf and Ghostscript, preserving the smallest valid version."""
    if level not in SUPPORTED_COMPRESSION_LEVELS:
        raise PdfCompressionError(
            400,
            f"Unsupported compression level '{level}'. Choose recommended, high, or maximum.",
        )

    original_size = input_path.stat().st_size

    # 1. Validate readability & run lossless pikepdf pass
    pikepdf_out = job_dir / "pikepdf.pdf"
    valid_pikepdf = _run_pikepdf_lossless(input_path, pikepdf_out)

    # 2. Locate Ghostscript and run downsampling compression pass
    gs_exe = find_ghostscript_executable(ghostscript_path)
    gs_out = job_dir / "gs.pdf"
    cmd = _build_gs_args(gs_exe, input_path, gs_out, level)

    try:
        completed = subprocess.run(
            cmd,
            shell=False,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise PdfCompressionError(
            504,
            "PDF compression timed out. Please try a smaller document.",
        ) from exc
    except OSError as exc:
        raise PdfCompressionError(
            503,
            "Unable to start Ghostscript compression process on the server.",
        ) from exc

    valid_gs = (
        gs_out if completed.returncode == 0 and _is_valid_pdf_file(gs_out) else None
    )

    candidates: list[Path] = []
    if valid_gs is not None:
        candidates.append(valid_gs)
    if valid_pikepdf is not None:
        candidates.append(valid_pikepdf)

    if not candidates:
        raise PdfCompressionError(
            500,
            "Failed to compress this PDF. The document may be damaged or unsupported.",
        )

    best_candidate = min(candidates, key=lambda p: p.stat().st_size)
    best_size = best_candidate.stat().st_size

    # If neither pass reduced size, preserve the original smaller valid PDF
    if best_size >= original_size:
        return PdfCompressionResult(
            output_path=input_path,
            original_size=original_size,
            compressed_size=original_size,
            saved_percent=0,
            preserved_original=True,
        )

    saved_percent = round(((original_size - best_size) / original_size) * 100)
    return PdfCompressionResult(
        output_path=best_candidate,
        original_size=original_size,
        compressed_size=best_size,
        saved_percent=saved_percent,
        preserved_original=False,
    )
