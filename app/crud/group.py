from sqlalchemy.orm import Session
from app.models.group import TreeGroup  
from app.schemas.group import GroupCreate, GroupUpdate
import uuid

# Create a new group
def create_group(db: Session, group_data: GroupCreate, owner_uid: uuid.UUID) -> TreeGroup:
    group = TreeGroup(
        group_uid=str(uuid.uuid4()),
        group_name=group_data.group_name,
        owner_id=str(owner_uid),
        reading_interval_minutes=group_data.reading_interval_minutes
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

# Get all groups for a user
def get_user_groups(db: Session, owner_uid: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(TreeGroup).filter(
        TreeGroup.owner_id == str(owner_uid)
    ).order_by(TreeGroup.group_name).offset(skip).limit(limit).all()  

# Get a specific group by ID
def get_group_by_id_only(db: Session, group_uid: uuid.UUID) -> TreeGroup | None:
    return db.query(TreeGroup).filter(TreeGroup.group_uid == str(group_uid)).first()

# Update a group
def update_group(db: Session, group: TreeGroup, group_data: GroupUpdate) -> TreeGroup:
    if group_data.group_name is not None:
        group.group_name = group_data.group_name
    if group_data.reading_interval_minutes is not None:
        group.reading_interval_minutes = group_data.reading_interval_minutes
    
    db.commit()
    db.refresh(group)
    return group

# Delete a group
def delete_group(db: Session, group: TreeGroup):
    db.delete(group)
    db.commit()