from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.crud import tree as tree_crud
from app.crud import group as group_crud
from app.schemas.tree import TreeCreate, TreeUpdate, TreeResponse, TreeCreateResponse
import uuid

router = APIRouter(prefix="/trees", tags=["Trees"])

# Create a new tree
@router.post("/", response_model=TreeResponse, status_code=status.HTTP_201_CREATED)
def create_tree(
    tree_data: TreeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if tree_data.group_id:
        group = group_crud.get_group_by_id_only(db, tree_data.group_id)
        
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found"
            )
        if group.owner_id != current_user.user_uid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to add trees to this group"
            )    
    tree = tree_crud.create_tree(db, tree_data, current_user.user_uid)
    return {
        "message": f"Tree '{tree.custom_name}' has been added successfully to group '{group.group_name}'.",
    }

# Get all trees in a specific group
@router.get("/group/{group_uid}", response_model=list[TreeResponse])
def get_trees_in_group(
    group_uid: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    group = group_crud.get_group_by_id_only(db, group_uid)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )    
    if group.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view trees in this group"
        )    
    return tree_crud.get_group_trees(db, group_uid, current_user.user_uid)

# Get a specific tree by ID
@router.get("/{tree_uid}", response_model=TreeResponse)
def get_tree(
    tree_uid: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree not found"
        )    
    if tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this tree"
        )
    return tree

# Update an existing tree
@router.put("/{tree_uid}", response_model=TreeResponse)
def update_tree(
    tree_uid: uuid.UUID,
    tree_data: TreeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree not found"
        )    
    if tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this tree"
        )    
    return tree_crud.update_tree(db, tree, tree_data)

# Delete a tree
@router.delete("/{tree_uid}", status_code=status.HTTP_200_OK)
def delete_tree(
    tree_uid: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tree = tree_crud.get_tree_by_id_only(db, tree_uid)
    if not tree:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tree not found"
        )    
    if tree.owner_id != current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this tree"
        )
    tree_crud.delete_tree(db, tree)
    
    return {
        "message": f"Tree '{tree.custom_name}' has been deleted successfully.",
    }