import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud import group as group_crud
from app.crud import recording as recording_crud
from app.crud import tree as tree_crud
from app.database import get_db
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupCreateResponse,
    GroupResponse,
    GroupUpdate,
)

router = APIRouter(prefix="/groups", tags=["Tree Groups"])


# Create a new group
@router.post(
    "/", response_model=GroupCreateResponse, status_code=status.HTTP_201_CREATED
)
def create_new_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_crud.create_group(db, group_data, current_user.user_uid)

    return {
        "message": f"Group '{group.group_name}' has been created successfully.",
        "group": group,
    }


# Get all groups for current user
@router.get("/", response_model=list[GroupResponse])
def get_my_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return group_crud.get_user_groups(db, current_user.user_uid, skip, limit)


# Get a specific group by ID
@router.get("/{group_uid}", response_model=GroupResponse)
def get_group(
    group_uid: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_crud.get_group_by_id_only(db, group_uid)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    if group.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this group",
        )

    return group


# Update an existing group
@router.put("/{group_uid}", response_model=GroupResponse)
def update_group(
    group_uid: uuid.UUID,
    group_data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_crud.get_group_by_id_only(db, group_uid)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    if group.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this group",
        )
    updated_group = group_crud.update_group(db, group, group_data)
    return updated_group


# Delete a group
@router.delete("/{group_uid}", status_code=status.HTTP_200_OK)
def delete_group(
    group_uid: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_crud.get_group_by_id_only(db, group_uid)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    if group.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this group",
        )
    group_crud.delete_group(db, group)

    return {
        "message": f"Group '{group.group_name}' has been deleted successfully.",
    }


# Analyze all trees in a group
@router.post("/{group_uid}/analyze", status_code=status.HTTP_200_OK)
def analyze_group(
    group_uid: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_crud.get_group_by_id_only(db, group_uid)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    if group.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to analyze this group",
        )

    # Get all trees in the group
    trees = tree_crud.get_group_trees(db, group_uid, current_user.user_uid)

    results = []
    for tree in trees:
        # Get the latest recording for this tree
        recordings = recording_crud.get_tree_recordings(
            db=db, tree_uid=tree.tree_uid, skip=0, limit=1
        )

        if not recordings:
            results.append(
                {
                    "tree_id": str(tree.tree_uid),
                    "sensor_id": tree.sensor_physical_id,
                    "custom_name": tree.custom_name,
                    "status": "No recordings found",
                    "prediction": None,
                    "confidence": None,
                }
            )
            continue

        latest_recording = recordings[0]

        # If already processed, return the saved results (no re-analysis)
        if (
            latest_recording.processing_status == "Completed"
            and latest_recording.prediction_from_model
        ):
            results.append(
                {
                    "tree_id": str(tree.tree_uid),
                    "sensor_id": tree.sensor_physical_id,
                    "custom_name": tree.custom_name,
                    "status": "Already analyzed",
                    "prediction": latest_recording.prediction_from_model,
                    "confidence": float(latest_recording.confidence_percentage)
                    if latest_recording.confidence_percentage
                    else None,
                }
            )
            continue

        # Process the recording with AI model (only if not already analyzed)
        try:
            from app.services import ai_service

            ai_results = ai_service.process_recording(
                str(latest_recording.recording_uid), db
            )
            ai_service.save_results_and_notify(
                db, str(latest_recording.recording_uid), ai_results
            )

            results.append(
                {
                    "tree_id": str(tree.tree_uid),
                    "sensor_id": tree.sensor_physical_id,
                    "custom_name": tree.custom_name,
                    "status": "Analyzed",
                    "prediction": ai_results["prediction"],
                    "confidence": ai_results["confidence"],
                }
            )
        except Exception as e:
            results.append(
                {
                    "tree_id": str(tree.tree_uid),
                    "sensor_id": tree.sensor_physical_id,
                    "custom_name": tree.custom_name,
                    "status": "Error",
                    "prediction": None,
                    "confidence": None,
                    "error": str(e),
                }
            )

    return {
        "message": f"Analysis completed for {len(trees)} trees in group '{group.group_name}'",
        "group_uid": str(group.group_uid),
        "group_name": group.group_name,
        "total_trees": len(trees),
        "results": results,
    }
