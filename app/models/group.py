import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# Tree groups table model
class TreeGroup(Base):
    __tablename__ = "tree_groups"

    group_uid = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_uid"),
        nullable=False
    )

    group_name = Column(String(100), default="Group 1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reading_interval_minutes = Column(Integer, default=30)

    # Relationships
    owner = relationship("User", back_populates="groups")
    trees = relationship("Tree", back_populates="group", cascade="all, delete-orphan")