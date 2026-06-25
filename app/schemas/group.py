from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

# Schema for creating a tree group
class GroupCreate(BaseModel):
    group_name: str = "Group 1"
    reading_interval_minutes: int = Field(60, ge=30, le=180)

# for updating a tree group
class GroupUpdate(BaseModel):
    group_name: Optional[str] = None
    reading_interval_minutes: Optional[int] = Field(None, ge=30, le=180)

# for returning group data in responses
class GroupResponse(BaseModel):
    group_uid: uuid.UUID
    owner_id: uuid.UUID
    group_name: str
    created_at: datetime
    reading_interval_minutes: int

    class Config:
        from_attributes = True

# for creating response message
class GroupCreateResponse(BaseModel):
    message: str
    group: GroupResponse