from pydantic import BaseModel
from typing import Optional
import uuid

# Token response schema
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# Token payload data schema
class TokenData(BaseModel):
    user_id: Optional[uuid.UUID] = None
    email: Optional[str] = None
