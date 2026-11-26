# DocConvertor — Render Free Deployment Guide

**Backend Directory:** `D:\DocConvertor\backend`  
**Render Blueprint:** [render.yaml](file:///d:/DocConvertor/render.yaml)  
**Dockerfile:** [Dockerfile](file:///d:/DocConvertor/backend/Dockerfile)  
**Status:** Prepared for Render Free (no deployment, account creation, or Git push performed)

---

## 1. Render Deployment Steps (No Payment Method Required)

1. Push the repository to your GitHub account (verify `.env` files are excluded by [.gitignore](file:///d:/DocConvertor/.gitignore)).
2. In the **Render Dashboard**, choose **New + &rarr; Blueprint** (to load [render.yaml](file:///d:/DocConvertor/render.yaml) automatically) or **New + &rarr; Web Service**:
   - **Environment / Runtime:** `Docker`
   - **Plan:** `Free` (512 MB RAM, 0.1 CPU)
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `./Dockerfile`
   - **Health Check Path:** `/api/health`
3. Set the required secret/domain variable:
   - `CORS_ORIGINS=https://your-frontend-domain.com` (comma-separated or JSON array)
4. Click **Create Web Service**. Once deployed, verify:
   ```bash
   curl -fsS https://<your-render-service>.onrender.com/api/health
   ```

---

## 2. Docker Configuration (`backend/Dockerfile`)

- **Base Image:** `python:3.12-slim`
- **System Packages:** `libreoffice-writer`, `ghostscript`, `fonts-liberation`, `fonts-dejavu-core`, `curl` (installed with `--no-install-recommends` and cleaned `apt` caches to keep image size compact).
- **Security:** Runs as non-root user `appuser`.
- **Port Binding:** Binds Uvicorn to `0.0.0.0` using Render's dynamic `${PORT:-10000}` environment variable (`--workers 1` to minimize memory overhead).
- **Health Check:** `HEALTHCHECK` probes `http://127.0.0.1:${PORT:-10000}/api/health`.

---

## 3. Environment Variables

| Variable | Render Value | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Disables Swagger `/docs` & `/redoc` |
| `LOG_LEVEL` | `INFO` | Structured application logging |
| `ENABLE_API_DOCS` | `false` | Keeps OpenAPI endpoints off in production |
| `CORS_ORIGINS` | `https://your-frontend-domain.com` | Allowed frontend origin(s) |
| `TEMP_DIR` | `/tmp/docconvertor` | Ephemeral per-job workspace directory |
| `MAX_UPLOAD_SIZE_MB` | `25` | Enforced per-file upload limit |
| `FILE_RETENTION_SECONDS` | `3600` | Startup stale temp directory cleanup age |
| `CONVERSION_TIMEOUT_SECONDS` | `120` | Subprocess / conversion timeout |
| `MAX_CONCURRENT_CONVERSIONS` | `1` | Global backend semaphore capping heavy conversions to 1 at a time on 512 MB RAM |

---

## 4. Render Free-Tier Limitations & Known Memory Behavior

- **512 MB RAM Ceiling:** Render Free provides ~512 MB RAM and spins down after 15 minutes of inactivity (causing ~30–60s cold starts on wake).
- **Backend Concurrency Cap (`MAX_CONCURRENT_CONVERSIONS=1`):** Although the frontend preserves its multi-file batch upload UI, the backend serializes heavy conversion jobs behind a shared `asyncio.Semaphore(1)` ([concurrency.py](file:///d:/DocConvertor/backend/app/utils/concurrency.py)) to prevent simultaneous LibreOffice/Ghostscript/pdf2docx processes from causing OOM crashes.
- **Measured Host Process RSS (`measure_memory.py`):**
  - Python + FastAPI/PDF libs baseline: **75.9 MB**
  - After `pdf2docx` (5-page PDF): **86.5 MB**
  - After `pikepdf` pass: **87.7 MB**
  - Single LibreOffice job peak tree RSS: **371.3 MB** (`+ ~76 MB` base = **~447 MB** — tight margin under 512 MB; large or image-heavy `.docx` files can still OOM on 512 MB)
  - Two concurrent LibreOffice jobs peak combined RSS: **639.8 MB** (would OOM on 512 MB without `MAX_CONCURRENT_CONVERSIONS=1`)
  - Ghostscript: *Not measured locally* (binary install blocked in Windows sandbox); inside Docker (`backend/Dockerfile`), Ghostscript is installed via `apt-get`.
- **Tool Viability on Render Free:**
  - **Compress Image:** Fully viable (runs 100% locally in the browser).
  - **PDF to Word:** Viable for small/medium PDFs.
  - **Compress PDF:** Conditional (fine for `pikepdf` / moderate PDFs; large high-DPI image PDFs can stress 512 MB).
  - **Word to PDF (LibreOffice):** Tight memory margin on 512 MB; works for simple/small DOCX files with `MAX_CONCURRENT_CONVERSIONS=1`, but complex/image-heavy Word files risk OOM (`503` / restart).

---

## 5. Local Testing Commands

### Backend (FastAPI + Automated Suite)
```powershell
cd d:\DocConvertor\backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Local Docker Build & Run (When Docker Is Installed)
```bash
cd backend
docker build -t docconvertor-api:latest .
docker run --rm -p 10000:10000 \
  -e PORT=10000 \
  -e ENVIRONMENT=production \
  -e MAX_CONCURRENT_CONVERSIONS=1 \
  -e CORS_ORIGINS="http://localhost:5173" \
  docconvertor-api:latest
```
Verify health:
```bash
curl -fsS http://127.0.0.1:10000/api/health
```
