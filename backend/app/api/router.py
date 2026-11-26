"""Root API router."""

from fastapi import APIRouter

from app.api.routes import compress_pdf, health, pdf_to_word, word_to_pdf

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(pdf_to_word.router)
api_router.include_router(word_to_pdf.router)
api_router.include_router(compress_pdf.router)
