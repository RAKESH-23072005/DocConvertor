FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    ENVIRONMENT=production \
    TEMP_DIR=/tmp/docconvertor

# Install LibreOffice headless, Ghostscript, and minimal fonts while keeping image compact
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    ghostscript \
    fonts-liberation \
    fonts-dejavu-core \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Create non-root user
RUN groupadd --system appgroup && useradd --system --gid appgroup --create-home appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN mkdir -p /tmp/docconvertor && chown -R appuser:appgroup /app /tmp/docconvertor

USER appuser

# Render injects PORT dynamically at runtime (commonly 10000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-10000}/api/health" || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
