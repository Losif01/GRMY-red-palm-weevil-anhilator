from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.models.credential import Credentials
import uuid

# Get user by email
def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

# Get user by ID
def get_user_by_id(db: Session, user_uid: uuid.UUID) -> User | None:
    return db.query(User).filter(User.user_uid == str(user_uid)).first()

# Create new user
def create_user(db: Session, user_data: UserCreate) -> User:
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise ValueError(f"Email '{user_data.email}' is already registered")
    
    try:
        # Create user
        user = User(
            name=user_data.name,
            email=user_data.email,
            phone_number=user_data.phone_number,
        )
        db.add(user)
        db.flush()  
        db.refresh(user)

        # Create credentials
        credentials = Credentials(
            user_uid=user.user_uid,
            username=user_data.email,
            password_hash=get_password_hash(user_data.password),
            system_access_level="User"
        )
        db.add(credentials)        
        db.commit()
        db.refresh(user)
        
        return user
        
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "email" in error_msg:
            raise ValueError(f"Email '{user_data.email}' is already registered")
        elif "username" in error_msg:
            raise ValueError(f"Username '{user_data.email}' is already taken")
        else:
            raise ValueError(f"Failed to create user: {error_msg}")
    except ValueError:
        raise
    except Exception as e:
        db.rollback()
        raise ValueError(f"Failed to create user: {str(e)}")

# Update user data
def update_user(db: Session, user: User, user_data: UserUpdate) -> User:
    try:
        update_data = user_data.model_dump(exclude_unset=True)
        
        if "email" in update_data:
            existing = get_user_by_email(db, update_data["email"])
            if existing and existing.user_uid != user.user_uid:
                raise ValueError(f"Email '{update_data['email']}' is already registered")
        
        for key, value in update_data.items():
            setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        return user
    except ValueError:
        raise
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Failed to update user: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise ValueError(f"Failed to update user: {str(e)}")

# Get all users
def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()