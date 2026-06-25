from sqlalchemy.orm import Session
from app.models.tree import Tree
from app.schemas.tree import TreeCreate, TreeUpdate
import uuid

# Create a new tree and auto-calculate display order
def create_tree(db: Session, tree_data: TreeCreate, owner_uid: uuid.UUID) -> Tree:
    if tree_data.group_id:
        last_order = db.query(Tree).filter(
            Tree.owner_id == owner_uid, 
            Tree.group_id == tree_data.group_id
        ).count()
    else:
        last_order = 0
    
    tree = Tree(
        owner_id=owner_uid, 
        sensor_physical_id=tree_data.sensor_physical_id,
        custom_name=tree_data.custom_name,
        group_id=tree_data.group_id,  
        display_order=last_order + 1
    )
    db.add(tree)
    db.commit()
    db.refresh(tree)
    return tree

# Get tree by ID only 
def get_tree_by_id_only(db: Session, tree_uid: uuid.UUID) -> Tree | None:
    return db.query(Tree).filter(Tree.tree_uid == tree_uid).first()

# Get a specific tree by ID and owner
def get_tree_by_id(db: Session, tree_uid: uuid.UUID, owner_uid: uuid.UUID) -> Tree | None:
    return db.query(Tree).filter(
        Tree.tree_uid == tree_uid, 
        Tree.owner_id == owner_uid 
    ).first()

# Get all trees inside a specific group for a user
def get_group_trees(db: Session, group_uid: uuid.UUID, owner_uid: uuid.UUID) -> list[Tree]:
    return db.query(Tree).filter(
        Tree.group_id == group_uid,  
        Tree.owner_id == owner_uid   
    ).all()

# Update an existing tree in the DB
def update_tree(db: Session, tree: Tree, tree_data: TreeUpdate) -> Tree:
    try:
        update_data = tree_data.model_dump(exclude_unset=True)
    except AttributeError:
        update_data = tree_data.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(tree, key, value)
    db.commit()
    db.refresh(tree)
    return tree

# Delete a tree from the DB
def delete_tree(db: Session, tree: Tree):
    db.delete(tree)
    db.commit()