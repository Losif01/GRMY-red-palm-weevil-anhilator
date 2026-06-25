import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal

# Schema for creating a new recording 
class RecordingCreate(BaseModel):
    tree_id: str
    
    class Config:
        from_attributes = True

# Schema for updating recording with AI results
class RecordingUpdate(BaseModel):
    prediction_from_model: str = Field(..., pattern="^(Clean|Infested)$")
    confidence_percentage: float = Field(..., ge=0, le=100)
    event_count: Optional[int] = None
    band_score: Optional[float] = None
    processed_audio_file_path: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema for returning recording response
class RecordingResponse(BaseModel):
    recording_uid: uuid.UUID  
    tree_id: uuid.UUID        
    
    raw_audio_file_path: str
    processed_audio_file_path: Optional[str] = None
    
    processing_status: str
    alert_sent: bool
    
    prediction_from_model: Optional[str] = None
    confidence_percentage: Optional[Decimal] = None
    
    event_count: Optional[int] = None
    band_score: Optional[Decimal] = None
    
    created_at: datetime

    class Config:
        from_attributes = True

# Schema for listing recordings (simplified)
class RecordingListResponse(BaseModel):
    recording_uid: str
    tree_id: str
    processing_status: str
    prediction_from_model: Optional[str] = None
    confidence_percentage: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# schema for creating response message
class RecordingCreateResponse(BaseModel):
    message: str
    recording: RecordingResponse