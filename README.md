# 👻 MeetingGhost

**Multi-Agent AI System for Meeting Summarization, Accountability Tracking and Automated Follow-up**

🚀 **[Live Demo (Streamlit)](https://meeting-ghost-1.streamlit.app/)** — Try it instantly, no login needed!

---

## Project Structure

This project has two parts:

```
MeetingGhost/
├── streamlit-app/     ← Quick demo (deployed on Streamlit Cloud)
└── fullstack/         ← Full-stack web app (FastAPI + Next.js)
    ├── backend/       ← REST API (FastAPI, JWT auth, SQLite)
    └── frontend/      ← Web UI (Next.js / React)
```

---

## Full-Stack App (FastAPI + Next.js)

### Features
- 🔐 User registration & login (JWT auth)
- 🎙️ Upload audio or paste transcript
- 🧠 AI analysis — summary, decisions, action items, risks (Groq LLaMA 3.3 70B)
- 📋 Persistent action item tracking per user
- ✉️ Auto-generated follow-up emails (sent via Gmail SMTP)
- 📊 Dashboard with stats

### Run Locally

**Backend (FastAPI):**
```bash
cd fullstack/backend
pip install -r requirements.txt
uvicorn main:app --reload
# API runs at http://localhost:8000
# Docs at   http://localhost:8000/docs
```

**Frontend (Next.js):**
```bash
cd fullstack/frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

### Environment Variables

**fullstack/backend/.env:**
```
GROQ_API_KEY=your_groq_key
GMAIL_ADDRESS=your_gmail
GMAIL_APP_PASSWORD=your_app_password
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

**fullstack/frontend/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Streamlit Demo

A standalone Streamlit prototype — no login required.

```bash
cd streamlit-app
pip install -r requirements.txt
streamlit run app.py
```

Or try it live: **https://meeting-ghost-1.streamlit.app/**

---

## Deployment Guide

### Deploying Backend to Render
1. Push your repository to GitHub.
2. Sign up on [Render.com](https://render.com) and create a new **Web Service**.
3. Connect your repository.
4. Render will automatically detect the `render.yaml` configuration in the root directory.
5. In your Render Dashboard, go to **Environment** and add the following missing environment variables:
   - `GROQ_API_KEY`
   - `GMAIL_ADDRESS`
   - `GMAIL_APP_PASSWORD`
   - `SECRET_KEY`

### Deploying Frontend to Vercel
1. Sign up on [Vercel](https://vercel.com) and click **Add New Project**.
2. Connect your GitHub repository.
3. In the project configuration:
   - Expand **Build and Output Settings** or **Root Directory** and set the root directory to `fullstack/frontend`.
   - Vercel will auto-detect Next.js.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` (Set this to your live Render backend URL, e.g., `https://meetingghost-backend.onrender.com`)
5. Click **Deploy**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI / LLM | Groq (LLaMA 3.3 70B + Whisper) |
| Backend API | FastAPI + SQLAlchemy + SQLite |
| Auth | JWT (python-jose + passlib) |
| Frontend | Next.js 16 (React + TypeScript) |
| Email | Gmail SMTP |
| Deployment | Vercel (frontend) + Render (backend) |
