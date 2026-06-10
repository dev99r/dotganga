# DotGanga Deployment Guide

## Step 1 — MongoDB Atlas

1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user with read/write access
3. Whitelist all IPs (0.0.0.0/0) for Render compatibility
4. Copy your connection string — it looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/dotganga?retryWrites=true&w=majority`

---

## Step 2 — Deploy Backend to Render

1. Push your code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Render will auto-detect `render.yaml` — confirm the settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Add the following **Environment Variables** in the Render dashboard:
   - `MONGODB_URI` → your Atlas connection string
   - `JWT_SECRET` → any strong random string (e.g. 64-char hex)
   - `FRONTEND_URL` → your Vercel app URL (e.g. `https://dotganga.vercel.app`)
   - `NODE_ENV` → `production` (already set in render.yaml)
   - `PORT` → `10000` (already set in render.yaml)
   - `JWT_EXPIRE` → `7d` (already set in render.yaml)
7. Deploy — Render will give you a URL like `https://dotganga-backend.onrender.com`

---

## Step 3 — Deploy Frontend to Vercel

1. Go to https://vercel.com → Import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add the following **Environment Variable** in the Vercel dashboard:
   - `VITE_API_URL` → `https://dotganga-backend.onrender.com/api`
     (replace with your actual Render URL from Step 2)
4. Deploy — Vercel will build and host your frontend

---

## Notes

- The frontend uses `VITE_API_URL` at build time (set in Vercel dashboard)
- See `frontend/.env.production.example` for the template
- The backend `render.yaml` is inside the `backend/` folder
- The root-level `render.yaml` targets the same backend — either works
- For local dev, create `frontend/.env.local` with `VITE_API_URL=http://localhost:5001/api`
