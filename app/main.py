from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings
from app.database import Base, engine
from app.models import credential, group, notification, recording, tree, user

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Smart Palm Bio-Monitoring System",
    version="1.0.0",
)

# Add your Vite frontend URLs here
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

app.include_router(api_router)


# Root endpoint
@app.get("/")
def root():
    return {"message": "Welcome to Smart Palm Monitoring System API", "docs": "/docs"}


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}
