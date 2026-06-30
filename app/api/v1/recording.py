import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud import recording as recording_crud
from app.crud import tree as tree_crud
from app.database import get_db
from app.models.user import User
from app.schemas.recording import RecordingCreateResponse, RecordingResponse
from app.services import recording_service

router = APIRouter(prefix="/recordings", tags=["Recordings"])


# Create recording
@router.post(
    "/", response_model=RecordingCreateResponse, status_code=status.HTTP_201_CREATED
)
async def create_recording(
    tree_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        tree_uid = uuid.UUID(tree_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tree_id format"
        )
    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found"
        )
    if tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add recordings to this tree",
        )
    recording = await recording_service.create_recording_from_upload(
        db=db, tree_uid=tree_uid, file=file
    )

    # Trigger AI processing (MOCK for now)
    try:
        from app.services import ai_service

        results = ai_service.process_recording(str(recording.recording_uid), db)
        ai_service.save_results_and_notify(db, str(recording.recording_uid), results)

        # Refresh recording to get updated data
        db.refresh(recording)

    except Exception as e:
        print(f"AI processing error: {e}")

    return {
        "message": f"Recording uploaded and processed. Result: {recording.prediction_from_model or 'Pending'}",
        "recording": recording,
    }


# Get all recordings for a specific tree
@router.get("/tree/{tree_id}", response_model=list[RecordingResponse])
def get_tree_recordings(
    tree_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        tree_uid = uuid.UUID(tree_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tree_id format"
        )
    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found"
        )

    if tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view recordings for this tree",
        )

    recordings = recording_service.get_tree_recordings(
        db=db, tree_uid=tree_uid, skip=skip, limit=limit
    )

    return recordings


# Get a specific recording by ID
@router.get("/{recording_id}", response_model=RecordingResponse)
def get_recording(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        recording_uid = uuid.UUID(recording_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recording_id format",
        )

    recording = recording_crud.get_recording_by_id(db=db, recording_uid=recording_uid)

    if not recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found"
        )

    if recording.tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this recording",
        )

    return recording


# Delete a recording
@router.delete("/{recording_id}", status_code=status.HTTP_200_OK)
def delete_recording(
    recording_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        recording_uid = uuid.UUID(recording_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recording_id format",
        )

    # Get recording
    recording = recording_crud.get_recording_by_id(db=db, recording_uid=recording_uid)

    if not recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found"
        )

    if recording.tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this recording",
        )
    recording_service.delete_recording_with_file(db=db, recording=recording)
    return {
        "message": f"Recording has been deleted successfully.",
    }
