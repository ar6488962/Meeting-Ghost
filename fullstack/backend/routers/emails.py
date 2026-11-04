"""Emails router — send emails and retrieve email history."""

import os
import sys
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import get_db
import models
import schemas
import auth as auth_utils
from agents.email_sender import send_email as smtp_send

router = APIRouter(prefix="/emails", tags=["Emails"])


@router.post("/send", response_model=schemas.EmailLogOut, status_code=201)
def send_email(
    payload: schemas.EmailSendRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Send an email and retain the draft even when delivery fails."""
    draft = None
    if payload.draft_id is not None:
        draft = (
            db.query(models.EmailDraft)
            .filter(
                models.EmailDraft.id == payload.draft_id,
                models.EmailDraft.user_id == current_user.id,
            )
            .first()
        )
        if not draft:
            raise HTTPException(status_code=404, detail="Email draft not found")

    success, message = smtp_send(
        to_address=payload.recipient,
        subject=payload.subject,
        body=payload.body,
    )

    if draft:
        draft.recipient = payload.recipient
        draft.subject = payload.subject
        draft.body = payload.body
        draft.status = "Sent" if success else "Draft"
        draft.error_message = None if success else message
        draft.sent_at = datetime.utcnow() if success else None
        if success:
            db.add(models.EmailLog(
                user_id=current_user.id,
                meeting_id=draft.meeting_id,
                recipient=draft.recipient,
                subject=draft.subject,
                body=draft.body,
                status="Sent",
            ))
    else:
        log = models.EmailLog(
            user_id=current_user.id,
            meeting_id=payload.meeting_id,
            recipient=payload.recipient,
            subject=payload.subject,
            body=payload.body,
            status="Sent" if success else "Failed",
            error_message=None if success else message,
        )
        db.add(log)

    db.commit()
    if not draft:
        db.refresh(log)

    if not success:
        raise HTTPException(status_code=502, detail=message)

    if draft:
        return schemas.EmailLogOut(
            id=draft.id,
            recipient=draft.recipient,
            subject=draft.subject,
            body=draft.body,
            status=draft.status,
            error_message=draft.error_message,
            sent_at=draft.sent_at or datetime.utcnow(),
            meeting_id=draft.meeting_id,
        )

    return schemas.EmailLogOut.model_validate(log)


@router.patch("/drafts/{draft_id}", response_model=schemas.EmailDraftOut)
def update_draft(
    draft_id: int,
    payload: schemas.EmailDraftUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Persist edits to an unsent draft for the current user."""
    draft = (
        db.query(models.EmailDraft)
        .filter(
            models.EmailDraft.id == draft_id,
            models.EmailDraft.user_id == current_user.id,
        )
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Email draft not found")

    draft.recipient = payload.recipient.strip()
    draft.subject = payload.subject
    draft.body = payload.body
    draft.error_message = None
    db.commit()
    db.refresh(draft)
    return schemas.EmailDraftOut.model_validate(draft)


@router.get("/history", response_model=List[schemas.EmailLogOut])
def email_history(
    meeting_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Get email send history for the current user (newest first)."""
    query = db.query(models.EmailLog).filter(models.EmailLog.user_id == current_user.id)
    if meeting_id is not None:
        query = query.filter(models.EmailLog.meeting_id == meeting_id)
    logs = query.order_by(models.EmailLog.sent_at.desc()).limit(100).all()
    return [schemas.EmailLogOut.model_validate(log) for log in logs]
