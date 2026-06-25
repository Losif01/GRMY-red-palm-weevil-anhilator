import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# Base user schema
class UserBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=20)

# Schema for creating a new user
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    # username: str

# Schema for updating user information
class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)

# Schema for returning user data
class UserResponse(UserBase):
    user_uid: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Schema for registration response
class UserRegisterResponse(BaseModel):
    message: str
    user: UserResponse