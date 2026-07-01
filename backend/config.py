import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "SentinelAI API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b3a8c1f0e2d3c4b5a69876543210abcd1234567890abcdef1234567890abcdef")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # SQLite Database Connection (Local Serverless file-based DB)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./kavach.db"
    )
    
    # Neo4j Settings
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    
    # Storage
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        "uploads"
    )

    class Config:
        env_file = ".env"

settings = Settings()
