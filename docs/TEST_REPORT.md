# DocConvertor — Render Deployment Readiness & Test Report

**Date:** November 26, 2026

---

## 1. Automated Verification Executed

- **Backend `unittest` Suite (`python -m unittest discover -s tests -v`)**: **6/6 PASS** (`test_health_endpoint`, `test_pdf_to_word_valid_and_multipage`, `test_pdf_to_word_validation_and_security`, `test_word_to_pdf_docx` via live LibreOffice, `test_compress_pdf_validation_and_pikepdf`, `test_concurrent_batch_and_temp_cleanup` with `0` leftover temp dirs).
- **Frontend `node:test` (`node --test tests\batchAndZip.test.mjs`)**: **4/4 PASS**.
- **Frontend Production Build (`npm run build` / `tsc -b && vite build`)**: **PASS**.

---

## 2. Docker & Memory Checks

- **Docker Build & Image Size**: **Not executed** on this Windows host because Docker / Docker Desktop is not installed (`docker` command not found).
- **Measured Host Process RSS (`measure_memory.py`)**:
  - Python + PDF libs baseline: **75.9 MB**
  - `pdf2docx` (5-page PDF): **86.5 MB**
  - `pikepdf` pass: **87.7 MB**
  - LibreOffice single job peak tree RSS: **371.3 MB** (`22.24s`)
  - LibreOffice 2 concurrent jobs peak combined RSS: **639.8 MB**
  - Ghostscript (`gswin64c.exe`): *Not measured locally* (sandbox Application Control blocked binary installer).
