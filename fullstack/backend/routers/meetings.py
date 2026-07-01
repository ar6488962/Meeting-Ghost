"""Meetings router — analyze transcripts and retrieve meeting history."""

import os
import sys
import tempfile
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

# Add agents directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import get_db
import models
import schemas
import auth as auth_utils
from agents.transcriber import process_transcript
from agents.intelligence import extract_meeting_intelligence
from agents.communicator import generate_follow_up_emails

router = APIRouter(prefix="/meetings", tags=["Meetings"])


def _is_overdue(deadline: str) -> bool:
    """Check if a deadline string represents a past date."""
    if not deadline or deadline in ("Not specified", "TBD", ""):
        return False
    try:
        for fmt in ["%Y-%m-%d", "%B %d", "%b %d", "%m/%d/%Y", "%d-%m-%Y"]:
            try:
                d = datetime.strptime(deadline, fmt)
                # If no year in format, assume current year
                if d.year == 1900:
                    d = d.replace(year=datetime.now().year)
                return d.date() < datetime.now().date()
            except ValueError:
                continue
        return False
    except Exception:
        return False


def _build_action_item_out(item: models.ActionItem) -> schemas.ActionItemOut:
    return schemas.ActionItemOut(
        id=item.id,
        owner_name=item.owner_name,
        task=item.task,
        deadline=item.deadline,
        status=item.status,
        created_at=item.created_at,
        completed_at=item.completed_at,
        meeting_id=item.meeting_id,
        is_overdue=_is_overdue(item.deadline) if item.status == "Pending" else False,
    )


@router.post("/analyze", response_model=schemas.MeetingOut, status_code=201)
def analyze_meeting(
    payload: schemas.MeetingAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """
    Analyze a meeting transcript.
    Returns full meeting intelligence including action items and email drafts.
    """
    try:
        # Step 1: Process and format transcript text
        transcript = process_transcript(payload.transcript)

        # Step 2: Extract meeting metrics, decisions, risks, and tasks
        intelligence = extract_meeting_intelligence(transcript)

        # Generate a title from the first sentence of the summary
        summary = intelligence.get("summary", "")
        title = summary.split(".")[0][:120] if summary else "Meeting"

        # Save meeting to DB
        meeting = models.Meeting(
            user_id=current_user.id,
            title=title,
            transcript=transcript,
            summary=summary,
            decisions=intelligence.get("decisions", []),
            unresolved_issues=intelligence.get("unresolved_issues", []),
            risks=intelligence.get("risks", []),
        )
        db.add(meeting)
        db.flush()  # Get meeting.id before adding action items

        # Step 3: Populate and save action items
        action_items_data = intelligence.get("action_items", [])
        saved_items = []
        for item_data in action_items_data:
            action_item = models.ActionItem(
                meeting_id=meeting.id,
                user_id=current_user.id,
                owner_name=item_data.get("owner", "Unassigned"),
                task=item_data.get("task", ""),
                deadline=item_data.get("deadline", "Not specified"),
                status="Pending",
            )
            db.add(action_item)
            saved_items.append(action_item)

        db.commit()
        db.refresh(meeting)
        for item in saved_items:
            db.refresh(item)

        # Step 4: Generate follow-up email drafts
        email_drafts = generate_follow_up_emails(action_items_data)
        email_draft_schemas = [
            schemas.EmailDraftOut(
                recipient=e.get("recipient", ""),
                subject=e.get("subject", ""),
                body=e.get("body", ""),
            )
            for e in email_drafts
        ]

        return schemas.MeetingOut(
            id=meeting.id,
            title=meeting.title,
            summary=meeting.summary,
            decisions=meeting.decisions or [],
            unresolved_issues=meeting.unresolved_issues or [],
            risks=meeting.risks or [],
            action_items=[_build_action_item_out(i) for i in saved_items],
            email_drafts=email_draft_schemas,
            created_at=meeting.created_at,
        )

    except Exception as e:
        db.rollback()
        err = str(e)
        if "non-empty list" in err or "action_items" in err.lower():
            raise HTTPException(
                status_code=422,
                detail="No meeting content detected. Please upload a real meeting/conversation recording, not music or silence."
            )
        raise HTTPException(status_code=500, detail=f"Analysis failed: {err}")


@router.post("/analyze-audio", response_model=schemas.MeetingOut, status_code=201)
async def analyze_audio(
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Transcribe an audio file and then analyze it."""
    try:
        suffix = os.path.splitext(audio.filename or "audio.mp3")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name

        transcript = process_transcript(tmp_path)
        os.unlink(tmp_path)

        # Reuse text analysis logic
        return analyze_meeting(
            schemas.MeetingAnalyzeRequest(transcript=transcript),
            db=db,
            current_user=current_user,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio analysis failed: {str(e)}")


@router.get("", response_model=List[schemas.MeetingListItem])
def list_meetings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """List all meetings for the current user (newest first)."""
    meetings = (
        db.query(models.Meeting)
        .filter(models.Meeting.user_id == current_user.id)
        .order_by(models.Meeting.created_at.desc())
        .all()
    )
    return [
        schemas.MeetingListItem(
            id=m.id,
            title=m.title,
            summary=m.summary[:200] + "..." if len(m.summary) > 200 else m.summary,
            created_at=m.created_at,
            action_item_count=len(m.action_items),
        )
        for m in meetings
    ]


@router.get("/{meeting_id}", response_model=schemas.MeetingOut)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Get a single meeting with full details."""
    meeting = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.id == meeting_id,
            models.Meeting.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return schemas.MeetingOut(
        id=meeting.id,
        title=meeting.title,
        summary=meeting.summary,
        decisions=meeting.decisions or [],
        unresolved_issues=meeting.unresolved_issues or [],
        risks=meeting.risks or [],
        action_items=[_build_action_item_out(i) for i in meeting.action_items],
        email_drafts=[],  # Not stored, regenerated on demand
        created_at=meeting.created_at,
    )
