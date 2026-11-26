"""Word to PDF conversion service using LibreOffice headless."""

import os
import shutil
import subprocess
from pathlib import Path


class WordConversionError(Exception):
    """Raised when a Word document cannot be converted to PDF."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def find_libreoffice_executable(configured_path: str | None = None) -> str:
    """Locate the LibreOffice headless executable across Windows and Linux."""
    candidates: list[str] = []

    if configured_path and configured_path.strip():
        candidates.append(configured_path.strip())

    env_override = os.environ.get("LIBREOFFICE_PATH", "").strip()
    if env_override:
        candidates.append(env_override)

    for cmd in ("soffice", "libreoffice"):
        resolved = shutil.which(cmd)
        if resolved:
            candidates.append(resolved)

    # Standard Windows & Linux installation paths
    candidates.extend(
        [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            "/usr/bin/soffice",
            "/usr/bin/libreoffice",
            "/usr/local/bin/soffice",
        ]
    )

    for candidate in candidates:
        path = Path(candidate)
        if path.is_file():
            return str(path)

    raise WordConversionError(
        503,
        "LibreOffice is not installed or could not be located on the server.",
    )


def convert_word_to_pdf(
    input_path: Path,
    output_dir: Path,
    libreoffice_path: str | None = None,
    timeout_seconds: int = 120,
) -> Path:
    """Convert a DOC/DOCX file into a PDF document using LibreOffice headless."""
    executable = find_libreoffice_executable(libreoffice_path)

    profile_dir = output_dir / "lo_profile"
    profile_dir.mkdir(parents=True, exist_ok=True)
    user_installation_arg = f"-env:UserInstallation={profile_dir.resolve().as_uri()}"

    cmd = [
        executable,
        "--headless",
        "--nologo",
        "--nodefault",
        "--nofirststartwizard",
        user_installation_arg,
        "--convert-to",
        "pdf",
        "--outdir",
        str(output_dir),
        str(input_path),
    ]

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
        raise WordConversionError(
            504,
            "Word to PDF conversion timed out. Please try a smaller or simpler document.",
        ) from exc
    except OSError as exc:
        raise WordConversionError(
            503,
            "Unable to start LibreOffice conversion process on the server.",
        ) from exc

    if completed.returncode != 0:
        raise WordConversionError(
            500,
            "LibreOffice could not convert this Word document. The file may be corrupted or unsupported.",
        )

    expected_pdf = output_dir / f"{input_path.stem}.pdf"
    if not expected_pdf.is_file() or expected_pdf.stat().st_size == 0:
        raise WordConversionError(
            500,
            "Word to PDF conversion completed without producing a valid PDF file.",
        )

    with expected_pdf.open("rb") as fh:
        signature = fh.read(5)
    if signature != b"%PDF-":
        raise WordConversionError(
            500,
            "The generated output is not a valid PDF document.",
        )

    return expected_pdf
