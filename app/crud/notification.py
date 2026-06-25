from sqlalchemy.orm import Session
from app.models.notification import Notification
import uuid
from datetime import datetime

# Create a new notification 
def create_notification(
    db: Session, 
    owner_uid: uuid.UUID, 
    tree_uid: uuid.UUID, 
    message: str,
    notification_type: str = "Email"
) -> Notification:
    notification = Notification(
        notification_uid=str(uuid.uuid4()),  
        owner_id=str(owner_uid),              
        tree_id=str(tree_uid),                
        message=message,
        notification_type=notification_type,
        sent_status=True,
        sent_at=datetime.now()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

# Get a specific notification by ID
def get_notification_by_id(db: Session, notification_uid: uuid.UUID) -> Notification | None:
    return db.query(Notification).filter(
        Notification.notification_uid == str(notification_uid) 
    ).first()

# Get all notifications for a specific user
def get_user_notifications(
    db: Session, 
    owner_uid: uuid.UUID, 
    skip: int = 0, 
    limit: int = 100,
    unseen_only: bool = False
) -> list[Notification]:
    query = db.query(Notification).filter(
        Notification.owner_id == str(owner_uid)  
    )
    if unseen_only:
        query = query.filter(Notification.notification_seen == False)
    
    return query.offset(skip).limit(limit).all()

# Mark notification as seen
def mark_notification_seen(db: Session, notification: Notification) -> Notification:
    notification.notification_seen = True
    db.commit()
    db.refresh(notification)
    return notification

# Mark notification as sent
def mark_notification_sent(db: Session, notification: Notification) -> Notification:
    notification.sent_status = True
    notification.sent_at = datetime.now()
    db.commit()
    db.refresh(notification)
    return notification

# Delete a notification
def delete_notification(db: Session, notification: Notification):
    db.delete(notification)
    db.commit()

# Get unread notifications count for a user
def get_unread_count(db: Session, owner_uid: uuid.UUID) -> int:
    return db.query(Notification).filter(
        Notification.owner_id == owner_uid,
        Notification.notification_seen == False
    ).count()