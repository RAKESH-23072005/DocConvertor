"""Application configuration loaded from environment variables."""

import json
from functools import lru_cache
from pathlib import Path
from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed environment settings for the DocConvertor API."""

    app_name: str = "DocConvertor API"
    app_version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"
    enable_api_docs: bool = True
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    temp_dir: Path = Path("./tmp")
    max_file_size_mb: int = Field(
        default=25,
        validation_alias=AliasChoices("MAX_UPLOAD_SIZE_MB", "MAX_FILE_SIZE_MB"),
    )
    file_retention_seconds: int = 7200
    conversion_timeout_seconds: int = 120
    max_concurrent_conversions: int = Field(
        default=2,
        validation_alias=AliasChoices(
            "MAX_CONCURRENT_CONVERSIONS", "MAX_CONCURRENT_LIBREOFFICE_JOBS"
        ),
    )
    libreoffice_path: str | None = None
    ghostscript_path: str | None = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]
        if isinstance(value, str):
            trimmed = value.strip()
            if not trimmed:
                return []
            if trimmed.startswith("["):
                parsed = json.loads(trimmed)
                return [str(v).strip() for v in parsed if str(v).strip()]
            return [part.strip() for part in trimmed.split(",") if part.strip()]
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
