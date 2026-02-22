# BJJ Clip Library Web (Deploy-Only)

This folder contains only what you need to host the website (no clipping pipeline).

## Folder layout

- `backend/` FastAPI API that reads metadata from Supabase and returns signed storage URLs.
- `frontend/` Vite/React UI.

## Local run

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
uvicorn web_api:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

```bash
cd frontend
npm i
cp .env.example .env
# set VITE_API_BASE=http://localhost:8000
npm run dev
```

## Deploy recommendation

- Backend: Render (Web Service)
- Frontend: Vercel
- Included config files:
  - `render.yaml` (backend)
  - `frontend/vercel.json` (frontend)

## Render backend settings

- Option A (recommended): use Blueprint with `render.yaml` from `deploy_web/`
- Option B (manual):
  - Root Directory: `deploy_web/backend`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn web_api:app --host 0.0.0.0 --port $PORT`
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CORS_ORIGINS` (comma-separated, include your Vercel domain)

## Vercel frontend settings

- Root Directory: `deploy_web/frontend`
- `vercel.json` is already included for build/output + SPA rewrites.
- Environment variables:
  - `VITE_API_BASE` = your Render backend URL (e.g. `https://your-api.onrender.com`)

## Notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend.
- Media is served from Supabase Storage through signed URLs returned by backend.
