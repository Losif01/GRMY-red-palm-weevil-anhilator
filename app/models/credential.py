from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

# Credentials table model
class Credentials(Base):
    __tablename__ = "credentials"

    user_uid = Column(String(36), ForeignKey("users.user_uid"), primary_key=True)

    username = Column(String(50), unique=True, nullable=False)

    password_hash = Column(String, nullable=False)

    system_access_level = Column(String(20), default="User")  # User / Admin

    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    user = relationship("User", back_populates="credentials")