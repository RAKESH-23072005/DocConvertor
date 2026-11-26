"""FastAPI application entry point for DocConvertor."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.utils.temp_files import TempFileManager

logger = logging.getLogger("docconvertor")


def _configure_logging(level_name: str) -> None:
    level = getattr(logging, level_name.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize temporary storage on startup and clean expired jobs."""
    settings = get_settings()
    _configure_logging(settings.log_level)
    temp_manager = TempFileManager(settings.temp_dir)
    removed = temp_manager.cleanup_expired(settings.file_retention_seconds)
    logger.info(
        "Started %s (%s). Cleaned %d expired temp job(s).",
        settings.app_name,
        settings.environment,
        removed,
    )
    app.state.temp_manager = temp_manager
    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()
    show_docs = settings.enable_api_docs and settings.environment != "production"

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs" if show_docs else None,
        redoc_url="/redoc" if show_docs else None,
        openapi_url="/openapi.json" if show_docs else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=[
            "Content-Disposition",
            "X-Original-Size",
            "X-Compressed-Size",
            "X-Saved-Percent",
            "X-Compression-Level",
            "X-Preserved-Original",
        ],
    )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."},
        )

    app.include_router(api_router, prefix="/api")
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/", tags=["Root"])
    def root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "health": "/api/health",
        }

    return app


app = create_app()
