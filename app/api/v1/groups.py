import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud import group as group_crud
from app.database import get_db
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupCreateResponse,
    GroupResponse,
    GroupUpdate,
)

router = APIRouter(prefix="/groups", tags=["Tree Groups"])


# 1. Change the response_model in the decorator to GroupCreateResponse
@router.post(
    "/", response_model=GroupCreateResponse, status_code=status.HTTP_201_CREATED
)
def create_new_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = group_crud.create_group(db, group_data, current_user.user_uid)

    # 2. Return both the message AND the group object
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
        # "group_uid": str(group_uid)
    }
