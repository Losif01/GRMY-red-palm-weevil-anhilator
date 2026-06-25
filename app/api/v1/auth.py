from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import user as user_crud
from app.schemas.user import UserCreate, UserResponse, UserRegisterResponse
from app.schemas.token import Token
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.config import settings
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Registration Operation
@router.post("/register", response_model=UserRegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = user_crud.create_user(db, user_data)
        
        # Bootstrap Admin Logic
        is_bootstrap_admin = False
        if settings.ADMIN_EMAIL and user_data.email.lower() == settings.ADMIN_EMAIL.lower():
            if user.credentials:
                user.credentials.system_access_level = "Admin"
                db.commit()
                db.refresh(user.credentials)
                is_bootstrap_admin = True
                print(f"Bootstrap Admin created: {user_data.email}")
        
        if is_bootstrap_admin:
            message = "Registration successful! Welcome."
        else:
            message = "Registration successful! Welcome to Palm Monitoring System."
        
        return {
            "message": message,
            "user": user
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

# Login Operation
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Get user by email
    user = user_crud.get_user_by_email(db, form_data.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get credentials
    credentials = user.credentials
    if not credentials or not verify_password(form_data.password, credentials.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create Tokens
    token_data = {"sub": user.email, "user_id": str(user.user_uid)}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# Refresh token endpoint
@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    email = payload.get("sub")
    user = user_crud.get_user_by_email(db, email)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    token_data = {"sub": user.email, "user_id": str(user.user_uid)}
    new_access = create_access_token(data=token_data)
    new_refresh = create_refresh_token(data=token_data)
    
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer"
    }

# Get user info (using his token)
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user