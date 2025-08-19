import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Configuration
API_PORT: int = int(os.getenv("API_PORT", "8000"))
API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
API_VERSION: str = "1.0.0"

# CORS Configuration
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# Allow all origins in development mode - this is useful for debugging
if "*" in CORS_ORIGINS or "all" in CORS_ORIGINS:
    CORS_ORIGINS = ["*"]
else:
    # Strip any whitespace from the origins
    CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS if origin.strip()]
    
    # Ensure we have at least one origin
    if not CORS_ORIGINS:
        CORS_ORIGINS = ["*"]  # Default fallback
    
    # Debug log the origins
    print(f"CORS Origins: {CORS_ORIGINS}")

# Vector Database - PGVector Settings
PGVECTOR_CONNECTION_STRING: str = os.getenv("PGVECTOR_CONNECTION_STRING", "postgresql://postgres:postgres@localhost:5432/vectordb")
PGVECTOR_TABLE_NAME: str = os.getenv("PGVECTOR_TABLE_NAME", "documents")

# Vector Database - Pinecone Settings
PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "")
PINECONE_INDEX: str = os.getenv("PINECONE_INDEX", "")

# OpenAI API Settings
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "dpais")
OPENAI_API_BASE: str = os.getenv("OPENAI_API_BASE", "http://localhost:8553/v1")
EMBEDDINGS_MODEL: str = os.getenv("EMBEDDINGS_MODEL", "nomic-embed-text")

# Feature flags for enabling/disabling specific vector stores
ENABLE_PGVECTOR: bool = os.getenv("ENABLE_PGVECTOR", "true").lower() == "true"
ENABLE_PINECONE: bool = os.getenv("ENABLE_PINECONE", "false").lower() == "true"   