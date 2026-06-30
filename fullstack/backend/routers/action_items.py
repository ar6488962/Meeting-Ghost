"""Action items router — list, complete, and delete action items."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/action-items", tags=["Action Items"])


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


@router.get("", response_model=List[schemas.ActionItemOut])
def get_action_items(
    status_filter: str = "Pending",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Get action items for the current user. Filter by status: Pending | Completed | All"""
    query = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == current_user.id
    )
    if status_filter != "All":
        query = query.filter(models.ActionItem.status == status_filter)

    items = query.order_by(models.ActionItem.created_at.desc()).all()

    return [
        schemas.ActionItemOut(
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
        for item in items
    ]


@router.patch("/{item_id}/complete", response_model=schemas.ActionItemOut)
def mark_complete(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Mark an action item as completed."""
    item = db.query(models.ActionItem).filter(
        models.ActionItem.id == item_id,
        models.ActionItem.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    item.status = "Completed"
    item.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    return schemas.ActionItemOut(
        id=item.id,
        owner_name=item.owner_name,
        task=item.task,
        deadline=item.deadline,
        status=item.status,
        created_at=item.created_at,
        completed_at=item.completed_at,
        meeting_id=item.meeting_id,
        is_overdue=False,
    )


@router.delete("/{item_id}", status_code=204)
def delete_action_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Delete an action item."""
    item = db.query(models.ActionItem).filter(
        models.ActionItem.id == item_id,
        models.ActionItem.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    db.delete(item)
    db.commit()
