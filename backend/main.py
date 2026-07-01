import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings
from backend.database.connection import engine, Base

# Auto-initialize SQLite database tables on startup
Base.metadata.create_all(bind=engine)

# Import routers
from backend.routers import auth, citizen, police, bank, telecom, admin, search

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="SentinelAI – AI Digital Public Safety Platform Backend API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits localhost:3000 and any client calls
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(citizen.router)
app.include_router(police.router)
app.include_router(bank.router)
app.include_router(telecom.router)
app.include_router(admin.router)
app.include_router(search.router)

# Health endpoint
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "database": "postgresql://connected"
    }

# Create uploads and static dirs if not exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(settings.UPLOAD_DIR), "static", "samples"), exist_ok=True)

# Mount static files (e.g. for note heatmaps)
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(settings.UPLOAD_DIR), "static")), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
