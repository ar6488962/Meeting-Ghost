"""
Pydantic v2 schemas for request/response validation.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Meeting Schemas ───────────────────────────────────────────────────────────

class ActionItemIn(BaseModel):
    owner: str
    task: str
    deadline: str


class ActionItemOut(BaseModel):
    id: int
    owner_name: str
    task: str
    deadline: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    meeting_id: int
    is_overdue: bool = False

    model_config = {"from_attributes": True}


class MeetingAnalyzeRequest(BaseModel):
    transcript: str

    @field_validator("transcript")
    @classmethod
    def transcript_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Transcript cannot be empty")
        return v.strip()


class EmailDraftOut(BaseModel):
    recipient: str
    subject: str
    body: str


class MeetingOut(BaseModel):
    id: int
    title: str
    summary: str
    decisions: List[str]
    unresolved_issues: List[str]
    risks: List[str]
    action_items: List[ActionItemOut]
    email_drafts: List[EmailDraftOut]
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingListItem(BaseModel):
    id: int
    title: str
    summary: str
    created_at: datetime
    action_item_count: int

    model_config = {"from_attributes": True}


# ─── Action Item Schemas ───────────────────────────────────────────────────────

class ActionItemUpdate(BaseModel):
    status: str  # "Completed" | "Pending"


# ─── Email Schemas ─────────────────────────────────────────────────────────────

class EmailSendRequest(BaseModel):
    recipient: str
    subject: str
    body: str
    meeting_id: Optional[int] = None

    @field_validator("recipient")
    @classmethod
    def valid_email(cls, v: str) -> str:
        v = v.strip()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v


class EmailLogOut(BaseModel):
    id: int
    recipient: str
    subject: str
    body: str
    status: str
    error_message: Optional[str] = None
    sent_at: datetime
    meeting_id: Optional[int] = None

    model_config = {"from_attributes": True}


# ─── Dashboard Stats Schema ────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_meetings: int
    total_pending_tasks: int
    total_overdue_tasks: int
    total_emails_sent: int


# ─── Settings/Profile Schemas ──────────────────────────────────────────────────

class UserProfileUpdate(BaseModel):
    full_name: str
    email: EmailStr

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("New password must be at least 6 characters")
        return v

