import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud import group as group_crud
from app.crud import tree as tree_crud
from app.database import get_db
from app.models.user import User
from app.schemas.tree import TreeCreate, TreeCreateResponse, TreeResponse, TreeUpdate

router = APIRouter(prefix="/trees", tags=["Trees"])


# Create a new tree
# 1. Change response_model to TreeCreateResponse
@router.post(
    "/", response_model=TreeCreateResponse, status_code=status.HTTP_201_CREATED
)
def create_tree(
    tree_data: TreeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group_name = "No Group"
    if tree_data.group_id:
        group = group_crud.get_group_by_id_only(db, tree_data.group_id)

        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
            )
        if group.owner_id != current_user.user_uid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to add trees to this group",
            )
        group_name = group.group_name

    tree = tree_crud.create_tree(db, tree_data, current_user.user_uid)

    # 2. Return the message AND the tree object
    return {
        "message": f"Tree '{tree.custom_name}' has been added successfully to group '{group_name}'.",
        "tree": tree,
    }


# Get all trees in a specific group
@router.get("/group/{group_uid}", response_model=list[TreeResponse])
def get_trees_in_group(
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
            detail="You don't have permission to view trees in this group",
        )
    return tree_crud.get_group_trees(db, group_uid, current_user.user_uid)


# Get a specific tree by ID
@router.get("/{tree_uid}", response_model=TreeResponse)
def get_tree(
    tree_uid: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found"
        )
    if tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this tree",
        )
    return tree


# Update an existing tree
@router.put("/{tree_uid}", response_model=TreeResponse)
def update_tree(
    tree_uid: uuid.UUID,
    tree_data: TreeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found"
        )
    if tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this tree",
        )
    return tree_crud.update_tree(db, tree, tree_data)


# Delete a tree
@router.delete("/{tree_uid}", status_code=status.HTTP_200_OK)
def delete_tree(
    tree_uid: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found"
        )
    if tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this tree",
        )
    tree_crud.delete_tree(db, tree)

    return {
        "message": f"Tree '{tree.custom_name}' has been deleted successfully.",
    }


# A simple schema for the ESP32 payload
class TreeStatusUpdate(BaseModel):
    battery_level: str = "OK"


@router.put("/{tree_id}/status")
def update_tree_status(
    tree_id: str, status_data: TreeStatusUpdate, db: Session = Depends(get_db)
):
    try:
        tree_uid = uuid.UUID(tree_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tree_id")

    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")

    print(
        f"\n💓 HEARTBEAT: Tree {tree.custom_name or tree_id} is awake! Battery: {status_data.battery_level}"
    )

    # 1. Update heartbeat and battery
    tree.current_status = "ONLINE"
    tree.battery_status = status_data.battery_level

    # 2. Calculate the next reading time based on the group's interval
    # (Assuming group has a reading_interval_minutes, defaulting to 60 if not)
    interval = 60
    if tree.group_id:
        group = group_crud.get_group_by_id_only(db, tree.group_id)
        if group and group.reading_interval_minutes:
            interval = group.reading_interval_minutes

    tree.next_reading_at = datetime.now(timezone.utc) + timedelta(minutes=interval)

    db.commit()

    return {
        "message": "Status updated successfully",
        "sleep_interval_minutes": interval,
    }
