from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.credential import Credentials  
from app.core.dependencies import require_admin
from app.models.user import User
import uuid

router = APIRouter(prefix="/admin", tags=["Admin"])

# Promote a user to Admin
@router.put("/make-admin/{user_id}")
def make_admin(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  
):
    # Validate UUID
    try:
        user_uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id format"
        )

    # Get credentials by user_id
    cred = db.query(Credentials).filter(
        Credentials.user_uid == user_uid
    ).first()

    # Check if credentials exist
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User credentials not found"
        )

    # Check if already admin
    if cred.system_access_level == "Admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already an Admin"
        )

    # Update role
    cred.system_access_level = "Admin"
    db.commit()
    db.refresh(cred)

    return {
        "message": "User promoted to Admin successfully",
        "user_id": user_id,
        "role": cred.system_access_level
    }


# Demote admin back to user
@router.put("/make-user/{user_id}")
def make_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  
):
    try:
        user_uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_id format"
        )

    # Get credentials by user_id
    cred = db.query(Credentials).filter(
        Credentials.user_uid == user_uid
    ).first()

    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User credentials not found"
        )

    # Check if already user
    if cred.system_access_level == "User":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a regular User"
        )

    # Prevent admin from demoting themselves
    if cred.user_uid == current_user.user_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself"
        )

    cred.system_access_level = "User"
    db.commit()
    db.refresh(cred)

    return {
        "message": "User demoted to User successfully",
        "user_id": user_id,
        "role": cred.system_access_level
    }