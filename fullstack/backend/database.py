"""
Database configuration — SQLAlchemy engine, session factory, and Base.
Supports both PostgreSQL (production on Render) and SQLite (local dev).
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Use DATABASE_URL from environment (PostgreSQL on Render) or fall back to SQLite locally
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render provides postgres:// URLs but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
else:
    # Local development: use SQLite
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_DIR = os.path.join(BASE_DIR, "database")
    os.makedirs(DB_DIR, exist_ok=True)
    SQLITE_URL = f"sqlite:///{os.path.join(DB_DIR, 'meetingghost.db')}"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
