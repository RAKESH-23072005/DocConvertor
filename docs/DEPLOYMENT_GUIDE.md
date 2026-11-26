# DocConvertor — Production Deployment Guide

**Status:** Ready for manual deployment (nothing has been deployed yet).  
**See also:** [RENDER_DEPLOYMENT.md](file:///d:/DocConvertor/docs/RENDER_DEPLOYMENT.md) for detailed Render Free Docker instructions and memory benchmarks.

---

## 1. Hosting Recommendations

### Frontend Hosts (React + Vite Static SPA)

| Provider | Free Tier | SPA Support | HTTPS / Custom Domain | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel** | Hobby (free for non-commercial; Pro \$20/mo for commercial) | `frontend/vercel.json` included | Automatic TLS + global CDN | **Recommended** for instant CDN deploys and `vercel.json` security headers. |
| **Netlify** | Starter (free; 100 GB bandwidth/mo) | `frontend/public/_redirects` included | Automatic TLS + global CDN | Strong alternative for static SPA hosting. |

### Backend Host (Docker + FastAPI + LibreOffice + Ghostscript)

| Provider | Docker Support | Free-Tier Constraints | Recommended Configuration |
| :--- | :--- | :--- | :--- |
| **Render** | Yes ([render.yaml](file:///d:/DocConvertor/render.yaml) + [Dockerfile](file:///d:/DocConvertor/backend/Dockerfile)) | Free Web Service: **512 MB RAM**, **0.1 CPU**, sleeps after 15 min idle. Set `MAX_CONCURRENT_CONVERSIONS=1`. | **Render Free** for initial testing (upgrade to **Render Standard 2 GB** for heavy Word-to-PDF / Ghostscript traffic). |

---

## 2. Required Environment Variables

### Frontend (`frontend/.env.production` or Hosting Dashboard)
- `VITE_APP_NAME=DocConvertor`
- `VITE_SITE_URL=https://your-frontend-domain.com`
- `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`
- `VITE_ADS_ENABLED=false` (set `true` only after AdSense approval + credentials)
- `VITE_ADSENSE_CLIENT_ID`, `VITE_ADSENSE_SLOT_HOME_MID`, `VITE_ADSENSE_SLOT_HOME_LOWER`, `VITE_ADSENSE_SLOT_TOOL_BOTTOM`, `VITE_ADSENSE_SLOT_DOWNLOAD_SIDEBAR`

### Backend ([render.yaml](file:///d:/DocConvertor/render.yaml) / [backend/.env.production.example](file:///d:/DocConvertor/backend/.env.production.example))
- `ENVIRONMENT=production`, `ENABLE_API_DOCS=false`, `LOG_LEVEL=INFO`
- `CORS_ORIGINS=https://your-frontend-domain.com`
- `TEMP_DIR=/tmp/docconvertor`, `MAX_UPLOAD_SIZE_MB=25`, `CONVERSION_TIMEOUT_SECONDS=120`, `MAX_CONCURRENT_CONVERSIONS=1`

---

## 3. Domain, HTTPS & AdSense Checklist

1. Configure custom domains and automatic Let's Encrypt HTTPS on Vercel/Netlify (frontend) and Render (backend).
2. Update `VITE_SITE_URL`, `CORS_ORIGINS`, [robots.txt](file:///d:/DocConvertor/frontend/public/robots.txt), and [sitemap.xml](file:///d:/DocConvertor/frontend/public/sitemap.xml) to your real domain.
3. Add `frontend/public/ads.txt`, configure your GDPR/EEA CMP consent banner if applicable, and replace `support@docconvertor.app` with your monitored support email before enabling `VITE_ADS_ENABLED=true`.
