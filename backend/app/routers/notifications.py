from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.notification import NotificationResponse
from ..services.notification_service import get_notifications, mark_notification_read, mark_all_read
from ..auth.dependencies import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_notifications(db, user.id)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return mark_notification_read(db, notification_id, user.id)


@router.post("/read-all")
def mark_all(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    mark_all_read(db, user.id)
    return {"message": "All notifications marked as read"}
