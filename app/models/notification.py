from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# Define the Notification model
class Notification(Base):
    __tablename__ = "notifications"

    notification_uid = Column(String(36), primary_key=True)

    owner_id = Column(String(36), ForeignKey("users.user_uid"))
    tree_id = Column(String(36), ForeignKey("trees.tree_uid"))
    notification_type = Column(String(10))  # Email / SMS

    message = Column(Text, nullable=False)
    sent_status = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)

    notification_seen = Column(Boolean, default=False)

    # Relationship
    owner = relationship("User", back_populates="notifications")
    tree = relationship("Tree", back_populates="notifications")
