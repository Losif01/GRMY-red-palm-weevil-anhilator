from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import notification as notification_crud
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.core.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Get all notifications for the current user
@router.get("/inbox", response_model=list[NotificationResponse])
def get_user_notifications(
    skip: int = 0,
    limit: int = 100,
    unseen_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = notification_crud.get_user_notifications(
        db=db,
        owner_uid=current_user.user_uid,
        skip=skip,
        limit=limit,
        unseen_only=unseen_only
    )
    
    return notifications

# Get unread notifications count
@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = notification_crud.get_unread_count(
        db=db,
        owner_uid=current_user.user_uid
    )
    
    return {"count": count}

# Get a specific notification by ID
@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        notification_uid = uuid.UUID(notification_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid notification_id format"
        )
    
    notification = notification_crud.get_notification_by_id(
        db=db,
        notification_uid=notification_uid
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # check from owner  
    if notification.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this notification"
        )
    
    if not notification.notification_seen:
        notification = notification_crud.mark_notification_seen(
            db=db,
            notification=notification
        )
    
    return notification

# Mark notification as seen
@router.put("/{notification_id}/seen", response_model=NotificationResponse)
def mark_notification_seen(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        notification_uid = uuid.UUID(notification_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid notification_id format"
        )
    
    notification = notification_crud.get_notification_by_id(
        db=db,
        notification_uid=notification_uid
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    # check if the notification belongs to current user
    if notification.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this notification"
        )
    notification = notification_crud.mark_notification_seen(
        db=db,
        notification=notification
    )
    return notification


# Delete a notification
@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        notification_uid = uuid.UUID(notification_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid notification_id format"
        )
    
    notification = notification_crud.get_notification_by_id(
        db=db,
        notification_uid=notification_uid
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    if notification.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification"
        )
    
    notification_crud.delete_notification(db=db, notification=notification)
    
    return {
        "message": "Notification deleted successfully.",
    }