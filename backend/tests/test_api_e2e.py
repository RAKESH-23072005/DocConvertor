"""End-to-end backend test suite for DocConvertor (Phases 4, 5, 6, 8, 9)."""

import concurrent.futures
import io
import json
import shutil
import sys
import threading
import time
import unittest
import urllib.error
import urllib.request
import uuid
from pathlib import Path

import docx
import pikepdf
import pymupdf
import uvicorn

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: E402
from app.services.compress_pdf import (  # noqa: E402
    PdfCompressionError,
    _run_pikepdf_lossless,
    find_ghostscript_executable,
)

TEST_PORT = 8029
BASE_URL = f"http://127.0.0.1:{TEST_PORT}/api"


def _post_multipart(
    path: str,
    filename: str,
    data: bytes,
    content_type: str,
    fields: dict[str, str] | None = None,
    timeout: int = 60,
) -> tuple[int, dict[str, str], bytes]:
    boundary = f"----DocConvertorUnit{uuid.uuid4().hex}"
    parts: list[bytes] = []
    if fields:
        for k, v in fields.items():
            parts.append(
                (
                    f"--{boundary}\r\n"
                    f'Content-Disposition: form-data; name="{k}"\r\n\r\n'
                    f"{v}\r\n"
                ).encode("utf-8")
            )
    parts.append(
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode("utf-8")
        + data
        + f"\r\n--{boundary}--\r\n".encode("utf-8")
    )
    body = b"".join(parts)

    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, {k.lower(): v for k, v in resp.headers.items()}, resp.read()
    except urllib.error.HTTPError as err:
        return err.code, {k.lower(): v for k, v in err.headers.items()}, err.read()


def _make_pdf(pages: list[str]) -> bytes:
    doc = pymupdf.open()
    for text in pages:
        page = doc.new_page()
        page.insert_text((72, 72), text, fontsize=14)
    buf = doc.tobytes()
    doc.close()
    return buf


def _make_scanned_pdf() -> bytes:
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 100, 100), False)
    pix.clear_with(200)
    png_bytes = pix.tobytes("png")
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_image(pymupdf.Rect(50, 50, 150, 150), stream=png_bytes)
    buf = doc.tobytes()
    doc.close()
    return buf


def _make_encrypted_pdf() -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Confidential")
    buf = doc.tobytes(
        encryption=pymupdf.PDF_ENCRYPT_AES_256,
        owner_pw="owner123",
        user_pw="user123",
    )
    doc.close()
    return buf


def _make_docx(paragraphs: list[str]) -> bytes:
    document = docx.Document()
    for p in paragraphs:
        document.add_paragraph(p)
    buf = io.BytesIO()
    document.save(buf)
    return buf.getvalue()


class DocConvertorApiTests(unittest.TestCase):
    server: uvicorn.Server

    @classmethod
    def setUpClass(cls) -> None:
        config = uvicorn.Config(app, host="127.0.0.1", port=TEST_PORT, log_level="warning")
        cls.server = uvicorn.Server(config)
        cls.thread = threading.Thread(target=cls.server.run, daemon=True)
        cls.thread.start()
        for _ in range(50):
            try:
                with urllib.request.urlopen(f"{BASE_URL}/health", timeout=1):
                    break
            except Exception:
                time.sleep(0.1)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.should_exit = True

    def test_health_endpoint(self) -> None:
        with urllib.request.urlopen(f"{BASE_URL}/health", timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            payload = json.loads(resp.read().decode("utf-8"))
            self.assertEqual(payload["status"], "ok")

    def test_pdf_to_word_valid_and_multipage(self) -> None:
        pdf_bytes = _make_pdf(["Page 1 Hello", "Page 2 World"])
        code, headers, body = _post_multipart(
            "/pdf-to-word", "multi.pdf", pdf_bytes, "application/pdf"
        )
        self.assertEqual(code, 200)
        self.assertIn("multi.docx", headers.get("content-disposition", ""))
        doc_out = docx.Document(io.BytesIO(body))
        full_text = "\n".join(p.text for p in doc_out.paragraphs)
        self.assertIn("Page 1 Hello", full_text)
        self.assertIn("Page 2 World", full_text)

    def test_pdf_to_word_validation_and_security(self) -> None:
        c1, _, _ = _post_multipart("/pdf-to-word", "bad.txt", b"hello", "text/plain")
        self.assertEqual(c1, 400)

        c2, _, _ = _post_multipart("/pdf-to-word", "empty.pdf", b"", "application/pdf")
        self.assertEqual(c2, 400)

        c3, _, _ = _post_multipart(
            "/pdf-to-word", "bad.pdf", b"%PDF-1.4\ncorrupt", "application/pdf"
        )
        self.assertEqual(c3, 400)

        c4, _, b4 = _post_multipart(
            "/pdf-to-word", "scan.pdf", _make_scanned_pdf(), "application/pdf"
        )
        self.assertEqual(c4, 422)
        self.assertIn("OCR", json.loads(b4)["detail"])

        c5, _, _ = _post_multipart(
            "/pdf-to-word", "enc.pdf", _make_encrypted_pdf(), "application/pdf"
        )
        self.assertEqual(c5, 400)

        oversized = b"%PDF-1.4\n" + (b"0" * (26 * 1024 * 1024))
        c6, _, _ = _post_multipart(
            "/pdf-to-word", "huge.pdf", oversized, "application/pdf"
        )
        self.assertEqual(c6, 413)

    def test_word_to_pdf_docx(self) -> None:
        docx_bytes = _make_docx(["LibreOffice conversion test"])
        code, headers, body = _post_multipart(
            "/word-to-pdf",
            "../../note.docx",
            docx_bytes,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        self.assertEqual(code, 200)
        self.assertIn("note.pdf", headers.get("content-disposition", ""))
        self.assertTrue(body.startswith(b"%PDF-"))
        pdf_doc = pymupdf.open(stream=body, filetype="pdf")
        text = "\n".join(page.get_text("text") for page in pdf_doc)
        pdf_doc.close()
        self.assertIn("LibreOffice conversion test", text)

    def test_compress_pdf_validation_and_pikepdf(self) -> None:
        pdf_bytes = _make_pdf(["Compress validation test"])
        c_bad, _, _ = _post_multipart(
            "/compress-pdf",
            "test.pdf",
            pdf_bytes,
            "application/pdf",
            fields={"level": "ultra"},
        )
        self.assertEqual(c_bad, 400)

        tmp_unit = BACKEND_ROOT / "tmp" / "unit_pikepdf"
        tmp_unit.mkdir(parents=True, exist_ok=True)
        try:
            in_p = tmp_unit / "in.pdf"
            out_p = tmp_unit / "out.pdf"
            in_p.write_bytes(pdf_bytes)
            res = _run_pikepdf_lossless(in_p, out_p)
            self.assertIsNotNone(res)
            with pikepdf.open(res) as p:
                self.assertEqual(len(p.pages), 1)
        finally:
            shutil.rmtree(tmp_unit, ignore_errors=True)

        try:
            find_ghostscript_executable()
            gs_available = True
        except PdfCompressionError:
            gs_available = False

        c_comp, _, _ = _post_multipart(
            "/compress-pdf",
            "test.pdf",
            pdf_bytes,
            "application/pdf",
            fields={"level": "recommended"},
        )
        if gs_available:
            self.assertEqual(c_comp, 200)
        else:
            self.assertEqual(c_comp, 503)

    def test_concurrent_batch_and_temp_cleanup(self) -> None:
        pdfs = [
            ("a.pdf", _make_pdf(["Batch A"])),
            ("b.pdf", _make_pdf(["Batch B"])),
            ("c.pdf", _make_pdf(["Batch C"])),
        ]
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(
                pool.map(
                    lambda it: _post_multipart(
                        "/pdf-to-word", it[0], it[1], "application/pdf"
                    ),
                    pdfs,
                )
            )
        for code, _, _ in responses:
            self.assertEqual(code, 200)

        tmp_dir = BACKEND_ROOT / "tmp"
        leftover = [p for p in tmp_dir.iterdir() if p.is_dir()] if tmp_dir.exists() else []
        self.assertEqual(leftover, [])


if __name__ == "__main__":
    unittest.main()
