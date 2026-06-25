import os
import uuid
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.crud import recording as recording_crud
from app.services import ai_service
from app.models.recording import Recording

UPLOAD_DIR = "uploads/recordings"

# Create recording from uploaded file
async def create_recording_from_upload(
    db: Session,
    tree_uid: uuid.UUID,
    file: UploadFile
) -> Recording:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "wav"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file to disk
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create recording in DB
    class RecordingData:
        def __init__(self, tid, path):
            self.tree_id = str(tid)
            self.raw_audio_file_path = path
    
    recording_data = RecordingData(tree_uid, file_path)
    recording = recording_crud.create_recording(
        db=db,
        recording_data=recording_data,
        tree_uid=tree_uid
    )
    
    # TODO: Trigger AI processing (async task queue recommended)
    # For now, we'll call it directly
    # ai_service.process_recording(recording.recording_uid)
    
    return recording

# Get all recordings for a tree
def get_tree_recordings(
    db: Session,
    tree_uid: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> list[Recording]:
    return recording_crud.get_tree_recordings(
        db=db,
        tree_uid=tree_uid,
        skip=skip,
        limit=limit
    )

# Delete recording and its file
def delete_recording_with_file(
    db: Session,
    recording: Recording
) -> None:
    # Delete the actual file from disk
    if recording.raw_audio_file_path and os.path.exists(recording.raw_audio_file_path):
        os.remove(recording.raw_audio_file_path)
    
    if recording.processed_audio_file_path and os.path.exists(recording.processed_audio_file_path):
        os.remove(recording.processed_audio_file_path)
    
    recording_crud.delete_recording(db=db, recording=recording)