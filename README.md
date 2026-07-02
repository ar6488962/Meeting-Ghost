# 👻 MeetingGhost

**Multi-Agent AI Workspace Platform for Meeting Summarization, Action Item Tracking, and Automated Email Dispatch**

MeetingGhost is a cloud-native, full-stack application designed to transform raw meeting audio or transcripts into actionable intelligence. It automatically processes recordings, extracts structured decisions and action items, tracks tasks persistently in a database, and generates personalized follow-up email drafts sent securely via API.

---

## 🏗️ Multi-Agent Architecture

The platform uses a modular multi-agent workflow to process and orchestrate meeting intelligence:

```mermaid
graph TD
    A[Meeting Audio / Transcript] --> B[Transcriber Agent]
    B -->|Whisper Transcription| C[Intelligence Agent]
    C -->|LLaMA 3.3 70B analysis| D[Database Agent]
    D -->|Persist Meetings, Risks & Tasks| E[(PostgreSQL / SQLite)]
    D --> F[Communicator Agent]
    F -->|Email Draft Generation| G[Email Sender Agent]
    G -->|Send via Brevo API| H[Recipient Inbox]
```

1. **🎙️ Transcriber Agent**: Automatically handles binary audio files, manages secure temp storage, and communicates with Groq's Whisper API to return precise, time-coded text transcripts.
2. **🧠 Intelligence Agent**: Instructs the LLaMA 3.3 70B model with structured prompts. It parses raw transcripts and outputs robust JSON matching precise schemas (summaries, decisions, open issues, risks, and task checklists).
3. **✉️ Communicator Agent**: Dynamically groups extracted action items by assigned owner and drafts professional, contextual follow-up emails for each stakeholder.
4. **🚀 Email Sender Agent**: Bypasses network blocks by utilizing the secure HTTPS-based Brevo API (port 443) to dispatch follow-up emails to stakeholders instantly.

---

## 💻 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 14 (React + TypeScript) | Premium, sleek dark mode dashboard with responsive grid layouts |
| **Backend API** | FastAPI (Python 3.14 compatible) | High-performance async REST framework |
| **AI Processing** | Groq (Whisper-large-v3 + LLaMA-3.3-70b) | Lightning-fast inference engine |
| **Database** | PostgreSQL (Production) / SQLite (Local) | Persistent task and meeting logging |
| **Authentication** | JWT (python-jose + bcrypt + passlib) | Secure credentials hashing and stateless sessions |
| **Email Delivery** | Brevo HTTP API | Bypasses ISP/hosting SMTP port restrictions |
| **Hosting** | Vercel (Frontend) + Render (Backend & DB) | Automated CI/CD serverless pipelines |

---

## 📁 Project Structure

```
MeetingGhost/
├── fullstack/
│   ├── backend/       ← FastAPI API, routers, SQLAlchemy models, and Agents
│   │   ├── agents/    ← AI Agents (transcriber, intelligence, communicator, email)
│   │   └── database/  ← SQLite local storage backup
│   └── frontend/      ← Next.js 14 Web Dashboard
└── streamlit-app/     ← Python standalone Streamlit prototype
```

---

## ⚙️ Environment Variables Config

### Backend Configuration (`fullstack/backend/.env`)
Create this file locally in the `fullstack/backend` directory:
```env
# AI Keys
GROQ_API_KEY=gsk_your_groq_api_key_here

# Database Settings (Leave empty locally to auto-default to SQLite)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Email settings
BREVO_API_KEY=your_brevo_api_key_here
SENDER_EMAIL=your_verified_brevo_sender_email@gmail.com

# Security
SECRET_KEY=generate_a_random_jwt_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Frontend Configuration (`fullstack/frontend/.env.local`)
Create this file in the `fullstack/frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🚀 Running Locally

### 1. Run the Backend API
```bash
cd fullstack/backend
pip install -r requirements.txt
uvicorn main:app --reload
```
* API Swagger documentation is available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Run the Next.js Frontend
```bash
cd fullstack/frontend
npm install
npm run dev
```
* Open the web app at: [http://localhost:3000](http://localhost:3000)

---

## ☁️ Cloud Deployment Guide

### 🗄️ Database Setup (Render PostgreSQL)
1. In Render, click **+ New** → select **PostgreSQL**.
2. Set Plan to **Free** and select your closest region.
3. Once available, copy the **Internal Database URL** from the database settings page.

### ⚙️ Backend Setup (Render Web Service)
1. Create a new **Web Service** on Render pointing to your GitHub repository.
2. Under **Settings**:
   * Set **Build Command** to `cd fullstack/backend && pip install -r requirements.txt`
   * Set **Start Command** to `cd fullstack/backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Under **Environment**, add the following variables:
   * `DATABASE_URL` (Set to your copied **Internal Database URL**)
   * `GROQ_API_KEY` (Your Groq API key)
   * `BREVO_API_KEY` (Your Brevo transactional email API key)
   * `SENDER_EMAIL` (Your verified sender email address on Brevo)
   * `SECRET_KEY` (Any secure random string)

### 🌐 Frontend Setup (Vercel)
1. Import your repository into Vercel as a new project.
2. In Project Settings, set the **Root Directory** to `fullstack/frontend`. Vercel will automatically select the **Next.js** framework preset.
3. In **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL` (Set to your live Render API URL, e.g. `https://meeting-ghost.onrender.com`)
4. Click **Deploy**.
