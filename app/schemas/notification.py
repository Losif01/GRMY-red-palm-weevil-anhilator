import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# Schema for creating a new notification (from AI service)
class NotificationCreate(BaseModel):
    owner_uid: str
    tree_uid: str
    message: str
    notification_type: str = Field(default="Email", pattern="^(Email|SMS)$")
    
    class Config:
        from_attributes = True

# Schema for updating notification
class NotificationUpdate(BaseModel):
    notification_seen: Optional[bool] = None
    sent_status: Optional[bool] = None
    
    class Config:
        from_attributes = True

# Schema for returning notification response
class NotificationResponse(BaseModel):
    notification_uid: uuid.UUID  
    owner_id: uuid.UUID          
    tree_id: uuid.UUID  
    message: str
    notification_type: Optional[str] = None
    sent_status: bool
    sent_at: Optional[datetime] = None
    notification_seen: bool

    class Config:
        from_attributes = True

# Schema for listing notifications 
class NotificationListResponse(BaseModel):
    notification_uid: str
    message: str
    notification_type: Optional[str] = None
    notification_seen: bool

    class Config:
        from_attributes = True

# Schema for unread count
class UnreadCountResponse(BaseModel):
    count: int