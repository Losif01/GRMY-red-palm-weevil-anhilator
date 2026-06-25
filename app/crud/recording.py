from sqlalchemy.orm import Session
from app.models.recording import Recording
from app.schemas.recording import RecordingCreate
import uuid
from typing import Optional

# Create a new recording
def create_recording(db: Session, recording_data, tree_uid: uuid.UUID) -> Recording:
    recording = Recording(
        recording_uid=str(uuid.uuid4()),  
        tree_id=str(tree_uid),            
        raw_audio_file_path=recording_data.raw_audio_file_path,
        processing_status="In Progress"
    )
    db.add(recording)
    db.commit()
    db.refresh(recording)
    return recording

# Get a specific recording by ID
def get_recording_by_id(db: Session, recording_uid: uuid.UUID) -> Recording | None:
    return db.query(Recording).filter(
        Recording.recording_uid == str(recording_uid)  
    ).first()

# Get all recordings for a specific tree
def get_tree_recordings(db: Session, tree_uid: uuid.UUID, skip: int = 0, limit: int = 100) -> list[Recording]:
    return db.query(Recording).filter(
        Recording.tree_id == str(tree_uid)  
    ).offset(skip).limit(limit).all()

# Update recording with AI prediction results
def update_recording_prediction(
    db: Session, 
    recording: Recording, 
    prediction: str, 
    confidence: float,
    event_count: Optional[int] = None,
    band_score: Optional[float] = None,
    processed_audio_path: Optional[str] = None
) -> Recording:
    recording.prediction_from_model = prediction
    recording.confidence_percentage = confidence
    recording.processing_status = "Completed"
    
    if event_count is not None:
        recording.event_count = event_count
    if band_score is not None:
        recording.band_score = band_score
    if processed_audio_path is not None:
        recording.processed_audio_file_path = processed_audio_path
    
    db.commit()
    db.refresh(recording)
    return recording

# Delete a recording
def delete_recording(db: Session, recording: Recording):
    db.delete(recording)
    db.commit()