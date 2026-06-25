from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel

# Schema for creating a tree
class TreeCreate(BaseModel):
    sensor_physical_id: str
    group_id: Optional[uuid.UUID] = None
    display_order: Optional[int] = None
    custom_name: Optional[str] = None

# Schema for updating a tree
class TreeUpdate(BaseModel):
    group_id: Optional[uuid.UUID] = None
    display_order: Optional[int] = None
    custom_name: Optional[str] = None
    current_status: Optional[str] = None
    battery_status: Optional[str] = None
    next_reading_at: Optional[datetime] = None
    latest_reading_classification: Optional[str] = None

# Schema for returning tree data
class TreeResponse(BaseModel):
    tree_uid: uuid.UUID
    sensor_physical_id: str
    owner_id: uuid.UUID
    group_id: Optional[uuid.UUID]
    display_order: Optional[int]
    custom_name: Optional[str]
    current_status: str
    battery_status: str
    next_reading_at: Optional[datetime]
    latest_reading_classification: Optional[str]
    registered_at: datetime

    class Config:
        from_attributes = True

# for creating response message
class TreeCreateResponse(BaseModel):
    message: str
    tree: TreeResponse