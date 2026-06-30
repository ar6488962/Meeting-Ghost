"""
MeetingGhost FastAPI Backend — main entry point.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import engine
import models

from routers import auth, meetings, action_items, emails, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables on startup."""
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="MeetingGhost API",
    description="Workspace intelligence platform for automatic meeting transcripts, tasks generation, and automated follow-up.",
    version="2.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(meetings.router)
app.include_router(action_items.router)
app.include_router(emails.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "app": "MeetingGhost API",
        "version": "2.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
