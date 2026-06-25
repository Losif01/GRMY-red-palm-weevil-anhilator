from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Numeric, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class Recording(Base):
    __tablename__ = "recordings"

    recording_uid = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))  
    tree_id = Column(String(36), ForeignKey("trees.tree_uid"))

    raw_audio_file_path = Column(Text, nullable=False)
    processed_audio_file_path = Column(Text, nullable=True)

    processing_status = Column(String(20), default="In Progress")

    alert_sent = Column(Boolean, default=False)

    prediction_from_model = Column(String(20))  # Clean / Infested
    confidence_percentage = Column(Numeric(5,2))

    event_count = Column(Integer)
    band_score = Column(Numeric(5,2))

    created_at = Column(DateTime, server_default=func.now())

    # Relationship
    tree = relationship("Tree", back_populates="recordings")

