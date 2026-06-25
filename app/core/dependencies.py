from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError
from typing import List
from app.database import get_db
from app.core.security import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Get current authenticated user from JWT token
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_token(token)
        if payload is None:
            raise credentials_exception
        
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user

# Role-based access control dependency
def require_role(allowed_roles: List[str]):
    """
    Check if user has required access level. allowed_roles: ['User', 'Admin']
    """
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Get user's credentials
        credentials = current_user.credentials
        
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No credentials found for this user"
            )
        
        # Check access level
        if credentials.system_access_level not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access level {credentials.system_access_level} not authorized. Required: {allowed_roles}"
            )
        
        return current_user
    
    return role_checker

# Admin-only dependency
def require_admin(current_user: User = Depends(require_role(["Admin"]))):
    return current_user

# User or Admin dependency
def require_user_or_admin(current_user: User = Depends(require_role(["User", "Admin"]))):
    return current_user