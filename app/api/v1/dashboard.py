import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.crud import group as group_crud
from app.crud import tree as tree_crud
from app.database import get_db
from app.models.user import User
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

class TreeStats(BaseModel):
    tree_uid: str
    sensor_physical_id: str
    custom_name: str
    status: str

class ZoneStats(BaseModel):
    group_uid: str
    group_name: str
    prediction: int
    trees: List[TreeStats]

class DashboardStats(BaseModel):
    total_trees: int
    healthy_trees: int
    warning_trees: int
    infested_trees: int
    zones: List[ZoneStats]

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    groups = group_crud.get_user_groups(db, current_user.user_uid, 0, 100)
    
    zones = []
    total_trees = 0
    total_healthy = 0
    total_warning = 0
    total_infested = 0
    
    for group in groups:
        trees = tree_crud.get_group_trees(db, group.group_uid, current_user.user_uid)
        
        tree_stats = []
        healthy = 0
        warning = 0
        infested = 0
        
        for tree in trees:
            # Map classification to status
            if tree.latest_reading_classification == "Clean":
                status = "Healthy"
                healthy += 1
            elif tree.latest_reading_classification == "Suspicious":
                status = "Warning"
                warning += 1
            elif tree.latest_reading_classification == "Infested":
                status = "Infested"
                infested += 1
            else:
                status = "Pending"
            
            tree_stats.append(TreeStats(
                tree_uid=str(tree.tree_uid),
                sensor_physical_id=tree.sensor_physical_id,
                custom_name=tree.custom_name or tree.sensor_physical_id,
                status=status
            ))
        
        # Calculate prediction (percentage of healthy trees)
        prediction = int((healthy / len(trees) * 100)) if trees else 0
        
        zones.append(ZoneStats(
            group_uid=str(group.group_uid),
            group_name=group.group_name,
            prediction=prediction,
            trees=tree_stats
        ))
        
        total_trees += len(trees)
        total_healthy += healthy
        total_warning += warning
        total_infested += infested
    
    return DashboardStats(
        total_trees=total_trees,
        healthy_trees=total_healthy,
        warning_trees=total_warning,
        infested_trees=total_infested,
        zones=zones
    )