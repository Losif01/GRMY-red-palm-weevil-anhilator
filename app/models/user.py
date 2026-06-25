import uuid
import enum
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# User roles enumeration
class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    MINISTRY_OFFICIAL = "ministry_official"
    FARM_MANAGER = "farm_manager"
    AGRONOMIST = "agronomist"
    SMALL_FARMER = "small_farmer"

# Users table model
class User(Base):
    __tablename__ = "users"

    user_uid = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    groups = relationship("TreeGroup", back_populates="owner")
    trees = relationship("Tree", back_populates="owner")
    credentials = relationship("Credentials", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="owner")

    def __repr__(self):
        return f"<User {self.email}>"
        