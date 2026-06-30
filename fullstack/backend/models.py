"""
SQLAlchemy ORM models for MeetingGhost.
Tables: users, meetings, action_items, email_logs
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    ForeignKey, Boolean, JSON
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    meetings = relationship("Meeting", back_populates="owner", cascade="all, delete")
    action_items = relationship("ActionItem", back_populates="user", cascade="all, delete")
    email_logs = relationship("EmailLog", back_populates="user", cascade="all, delete")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), default="Meeting")
    transcript = Column(Text, nullable=False)
    summary = Column(Text, default="")
    decisions = Column(JSON, default=list)
    unresolved_issues = Column(JSON, default=list)
    risks = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="meetings")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete")
    email_logs = relationship("EmailLog", back_populates="meeting", cascade="all, delete")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_name = Column(String(255), default="Unassigned")
    task = Column(Text, nullable=False)
    deadline = Column(String(100), default="Not specified")
    status = Column(String(50), default="Pending")  # Pending / Completed
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    meeting = relationship("Meeting", back_populates="action_items")
    user = relationship("User", back_populates="action_items")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(50), default="Sent")  # Sent / Failed
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="email_logs")
    meeting = relationship("Meeting", back_populates="email_logs")
