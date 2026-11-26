"""Image compression service boundary (client-side Canvas / optional server fallback)."""

from pathlib import Path


def compress_image(input_path: Path, output_path: Path, quality: int = 80) -> Path:
    """Compress a raster image at the specified quality.

    Not yet implemented in the initialization phase.
    """
    raise NotImplementedError("Image compression is not implemented yet.")
