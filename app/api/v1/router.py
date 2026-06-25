from fastapi import APIRouter
from app.api.v1 import auth, groups, trees
from app.api.v1 import admin, recording, notification  
from app.api.v1 import websocket

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(admin.router)
api_router.include_router(auth.router)
api_router.include_router(groups.router)
api_router.include_router(trees.router)
api_router.include_router(recording.router)  
api_router.include_router(notification.router)

api_router.include_router(websocket.router)