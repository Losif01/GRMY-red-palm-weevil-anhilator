import uuid
from sqlalchemy.orm import Session
from app.crud import notification as notification_crud
from app.models.notification import Notification

# Create infestation alert notification
def create_infestation_alert(
    db: Session,
    owner_uid: uuid.UUID,
    tree_uid: uuid.UUID,
    tree_name: str,
    group_name: str,
    confidence: float
) -> Notification:
    message = (
        f"RPW Detection Alert\n\n"
        f"Tree: {tree_name}\n"
        f"Group: {group_name}\n"
        f"Confidence: {confidence:.1f}%\n\n"
        f"Please inspect the tree immediately."
    )
    
    # Create notification in database
    notification = notification_crud.create_notification(
        db=db,
        owner_uid=owner_uid,
        tree_uid=tree_uid,
        message=message,
        notification_type="Email"
    )
    
    # TODO: Send actual Email/SMS here
    # send_email(owner_uid, message)
    
    return notification

# Get user notifications
def get_user_notifications(
    db: Session,
    owner_uid: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    unseen_only: bool = False
) -> list[Notification]:
    return notification_crud.get_user_notifications(
        db=db,
        owner_uid=owner_uid,
        skip=skip,
        limit=limit,
        unseen_only=unseen_only
    )

# Mark notification as seen
def mark_notification_seen(
    db: Session,
    notification_uid: uuid.UUID
) -> Notification:
    notification = notification_crud.get_notification_by_id(
        db=db,
        notification_uid=notification_uid
    )
    
    if not notification:
        raise ValueError(f"Notification {notification_uid} not found")
    
    return notification_crud.mark_notification_seen(
        db=db,
        notification=notification
    )

# Get unread count
def get_unread_count(
    db: Session,
    owner_uid: uuid.UUID
) -> int:
    return notification_crud.get_unread_count(
        db=db,
        owner_uid=owner_uid
    )