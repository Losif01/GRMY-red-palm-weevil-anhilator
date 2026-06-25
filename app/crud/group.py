from sqlalchemy.orm import Session
from app.models.group import TreeGroup
from app.schemas.group import GroupCreate, GroupUpdate
import uuid

# Create a new group in the DB
def create_group(db: Session, group_data: GroupCreate, owner_uid: uuid.UUID) -> TreeGroup:
    group = TreeGroup(
        owner_id=owner_uid,  
        group_name=group_data.group_name,
        reading_interval_minutes=group_data.reading_interval_minutes
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

# Get group by ID only 
def get_group_by_id_only(db: Session, group_uid: uuid.UUID) -> TreeGroup | None:
    return db.query(TreeGroup).filter(TreeGroup.group_uid == group_uid).first()

# Get a specific group by ID and owner
def get_group_by_id(db: Session, group_uid: uuid.UUID, owner_uid: uuid.UUID) -> TreeGroup | None:
    return db.query(TreeGroup).filter(
        TreeGroup.group_uid == group_uid, 
        TreeGroup.owner_id == owner_uid  
    ).first()

# Get all groups for a specific user with pagination
def get_user_groups(db: Session, owner_uid: uuid.UUID, skip: int = 0, limit: int = 100) -> list[TreeGroup]:
    return db.query(TreeGroup).filter(
        TreeGroup.owner_id == owner_uid  
    ).offset(skip).limit(limit).all()

# Update an existing group in the DB
def update_group(db: Session, group: TreeGroup, group_data: GroupUpdate) -> TreeGroup:
    try:
        update_data = group_data.model_dump(exclude_unset=True)
    except AttributeError:
        update_data = group_data.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(group, key, value)
    db.commit()
    db.refresh(group)
    return group

# Delete a group from the DB
def delete_group(db: Session, group: TreeGroup):
    db.delete(group)
    db.commit()