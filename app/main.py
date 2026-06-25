from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.v1.router import api_router
from app.models import user, credential, group, tree, recording, notification  

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Smart Palm Bio-Monitoring System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)  

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to Smart Palm Monitoring System API",
        "docs": "/docs"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}