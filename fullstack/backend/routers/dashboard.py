"""
Dashboard stats router.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _is_overdue(deadline: str) -> bool:
    if not deadline or deadline in ("Not specified", "TBD", ""):
        return False
    try:
        for fmt in ["%Y-%m-%d", "%B %d", "%b %d", "%m/%d/%Y", "%d-%m-%Y"]:
            try:
                d = datetime.strptime(deadline, fmt)
                if d.year == 1900:
                    d = d.replace(year=datetime.now().year)
                return d.date() < datetime.now().date()
            except ValueError:
                continue
        return False
    except Exception:
        return False


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Return dashboard statistics for the current user."""
    total_meetings = db.query(models.Meeting).filter(
        models.Meeting.user_id == current_user.id
    ).count()

    pending_items = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == current_user.id,
        models.ActionItem.status == "Pending",
    ).all()

    overdue = sum(1 for i in pending_items if _is_overdue(i.deadline))

    emails_sent = db.query(models.EmailLog).filter(
        models.EmailLog.user_id == current_user.id,
        models.EmailLog.status == "Sent",
    ).count()

    return schemas.DashboardStats(
        total_meetings=total_meetings,
        total_pending_tasks=len(pending_items),
        total_overdue_tasks=overdue,
        total_emails_sent=emails_sent,
    )
