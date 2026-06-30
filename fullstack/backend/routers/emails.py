"""Emails router — send emails and retrieve email history."""

import os
import sys
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
    """Send an email via Gmail SMTP and log it to the database."""
    success, message = smtp_send(
        to_address=payload.recipient,
        subject=payload.subject,
        body=payload.body,
    )

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
    db.refresh(log)

    if not success:
        raise HTTPException(status_code=502, detail=message)

    return schemas.EmailLogOut.model_validate(log)


@router.get("/history", response_model=List[schemas.EmailLogOut])
def email_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Get email send history for the current user (newest first)."""
    logs = (
        db.query(models.EmailLog)
        .filter(models.EmailLog.user_id == current_user.id)
        .order_by(models.EmailLog.sent_at.desc())
        .limit(100)
        .all()
    )
    return [schemas.EmailLogOut.model_validate(log) for log in logs]
