# DocConvertor

A clean, fast, iLovePDF-inspired document & image utility web application built with **React + TypeScript + Tailwind CSS** and **Python + FastAPI**.

## Core Tools

1. **PDF to Word** (`/pdf-to-word`) — Convert PDF files to `.docx` via `pdf2docx` (`POST /api/pdf-to-word`).
2. **Word to PDF** (`/word-to-pdf`) — Convert `.doc`/`.docx` files to `.pdf` via LibreOffice headless (`POST /api/word-to-pdf`).
3. **Compress PDF** (`/compress-pdf`) — Optimize PDF file size via Ghostscript and `pikepdf` (`POST /api/compress-pdf`).
4. **Compress Image** (`/compress-image`) — Optimize JPG, PNG, and WebP images directly in the browser (`Canvas` / `browser-image-compression`).

---

## Monorepo Structure

```text
DocConvertor/
├── frontend/          # React + TypeScript + Vite + Tailwind CSS
├── backend/           # Python + FastAPI + Uvicorn + Dockerfile
├── docs/              # Architecture, testing & deployment guides
├── render.yaml        # Render Free Docker Blueprint
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** `>= 20` and **npm**
- **Python** `>= 3.11`
- **LibreOffice** (`soffice`) for Word to PDF
- **Ghostscript** (`gs` / `gswin64c`) for Compress PDF

---

## Local Setup

### 1. Backend (FastAPI)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify health:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

Run backend tests:

```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

### 2. Frontend (React + Vite)

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Production Deployment

- **Backend (Render Free Docker):** See [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md) and [render.yaml](render.yaml).
- **Frontend (Vercel / Netlify):** See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) and [frontend/vercel.json](frontend/vercel.json).

---

## Key Environment Variables

### `backend/.env` (see [backend/.env.example](backend/.env.example))
- `ENVIRONMENT` — `development` or `production`
- `CORS_ORIGINS` — JSON array or comma-separated list of allowed frontend origins
- `TEMP_DIR` — Temporary job workspace directory (`./tmp` locally, `/tmp/docconvertor` in Docker)
- `MAX_UPLOAD_SIZE_MB` — Maximum upload size per file (`25`)
- `CONVERSION_TIMEOUT_SECONDS` — Per-conversion timeout (`120`)
- `MAX_CONCURRENT_CONVERSIONS` — Max simultaneous heavy conversions (`1` on Render Free)

### `frontend/.env` (see [frontend/.env.example](frontend/.env.example))
- `VITE_APP_NAME` — Display name (`DocConvertor`)
- `VITE_SITE_URL` — Public site URL
- `VITE_API_BASE_URL` — Backend API base URL (`http://127.0.0.1:8000/api` locally, or `/api` / Render URL in production)
