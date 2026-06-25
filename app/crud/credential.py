from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.credential import Credentials
from app.core.security import get_password_hash
import uuid

# Create credentials for a new user
def create_credentials(
    db: Session,
    user_uid: uuid.UUID,
    username: str,
    password: str,
    system_access_level: str = "User"
) -> Credentials:
    existing = db.query(Credentials).filter(
        Credentials.user_uid == user_uid
    ).first()
    
    if existing:
        raise ValueError(f"Credentials already exist for user {user_uid}")
    
    existing_username = db.query(Credentials).filter(
        Credentials.username == username
    ).first()
    
    if existing_username:
        raise ValueError(f"Username '{username}' is already taken")
    
    credentials = Credentials(
        user_uid=user_uid,
        username=username,
        password_hash=get_password_hash(password),
        system_access_level=system_access_level
    )
    
    try:
        db.add(credentials)
        db.commit()
        db.refresh(credentials)
        return credentials
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Failed to create credentials: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise e

# Get credentials by user_uid
def get_credentials_by_user_uid(db: Session, user_uid: uuid.UUID) -> Credentials | None:
    return db.query(Credentials).filter(Credentials.user_uid == user_uid).first()

# Update password
def update_password(
    db: Session,
    credentials: Credentials,
    new_password: str
) -> Credentials:
    try:
        credentials.password_hash = get_password_hash(new_password)
        db.commit()
        db.refresh(credentials)
        return credentials
    except Exception as e:
        db.rollback()
        raise e

# Update access level
def update_access_level(
    db: Session,
    credentials: Credentials,
    access_level: str
) -> Credentials:
    try:
        credentials.system_access_level = access_level
        db.commit()
        db.refresh(credentials)
        return credentials
    except Exception as e:
        db.rollback()
        raise e