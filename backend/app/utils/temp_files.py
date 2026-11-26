"""Temporary workspace and file cleanup management."""

import shutil
import time
import uuid
from pathlib import Path


class TempFileManager:
    """Manages isolated per-job temporary directories and retention cleanup."""

    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def create_job_dir(self) -> Path:
        """Create and return a unique temporary directory for a processing job."""
        job_dir = self.base_dir / uuid.uuid4().hex
        job_dir.mkdir(parents=True, exist_ok=True)
        return job_dir

    def remove_job_dir(self, job_dir: Path) -> None:
        """Delete a job directory and all of its contents, retrying brief Windows locks."""
        if not job_dir.exists() or not job_dir.is_dir():
            return

        for attempt in range(6):
            try:
                shutil.rmtree(job_dir)
                return
            except PermissionError:
                if attempt < 5:
                    time.sleep(0.25)
                else:
                    shutil.rmtree(job_dir, ignore_errors=True)
            except OSError:
                shutil.rmtree(job_dir, ignore_errors=True)
                return

    def cleanup_expired(self, retention_seconds: int) -> int:
        """Remove job directories older than retention_seconds. Returns count removed."""
        if not self.base_dir.exists():
            return 0
        now = time.time()
        removed = 0
        for entry in self.base_dir.iterdir():
            if entry.is_dir() and (now - entry.stat().st_mtime) > retention_seconds:
                shutil.rmtree(entry, ignore_errors=True)
                removed += 1
        return removed
