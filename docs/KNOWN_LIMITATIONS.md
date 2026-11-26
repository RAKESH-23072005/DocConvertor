# DocConvertor — Known Limitations & Operational Notes

1. **AdSense Credentials Pending (Disabled by Default):**
   - `VITE_ADS_ENABLED` is `false` across `.env`, `.env.example`, and `.env.production`. Live AdSense units will not load until approved `VITE_ADSENSE_CLIENT_ID` and slot IDs are provided and `VITE_ADS_ENABLED=true` is set.

2. **Results Session Persistence on Browser Refresh:**
   - Processed file `Blob`s are held in browser memory (`BatchResultContext`) for privacy and are cleared on page refresh; `DownloadPage` shows a friendly session-expired recovery view.

3. **Ghostscript System Binary Pending for `POST /api/compress-pdf`:**
   - **LibreOffice (`soffice.exe`)** is installed and verified (`POST /api/word-to-pdf` passes live).
   - **Ghostscript (`gswin64c.exe` / `gs`)** is not yet installed on this host (sandbox Application Control blocked installer execution), so `POST /api/compress-pdf` returns `503` until Ghostscript is installed locally.

4. **Local Lint Tooling (`oxlint`) on Windows:**
   - `npm run lint` (`oxlint`) is blocked on Windows by Application Control on `oxlint.win32-x64-msvc.node`. `tsc -b` and `vite build` run cleanly.
