import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# Tree status enumeration
class TreeStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"


# Battery status enumeration
class BatteryStatus(str, enum.Enum):
    OK = "OK"
    LOW = "LOW"


# Trees table model
class Tree(Base):
    __tablename__ = "trees"

    tree_uid = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    sensor_physical_id = Column(String(100), nullable=False)
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_uid"),
        nullable=False
    )

    group_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tree_groups.group_uid"),
        nullable=True
    )

    display_order = Column(Integer)
    custom_name = Column(String(100))
    current_status = Column(
        String(10),
        default=TreeStatus.ONLINE.value,
        nullable=False
    )
    battery_status = Column(
        String(10),
        default=BatteryStatus.OK.value,
        nullable=False
    )
    next_reading_at = Column(DateTime(timezone=True))
    latest_reading_classification = Column(String(50))
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="trees")
    group = relationship("TreeGroup", back_populates="trees")
    recordings = relationship("Recording", back_populates="tree", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="tree",cascade="all, delete-orphan")