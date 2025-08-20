import logging
from fastapi import APIRouter, HTTPException
from app.config import API_VERSION
from app.models.schema import HealthResponse
from app.services.vector_stores import vector_store_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    """
    return HealthResponse(status="ok", version=API_VERSION)


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check including vector store connectivity
    """
    try:
        vector_store_status = vector_store_service.check_connections()
        
        health_data = {
            "status": "ok",
            "version": API_VERSION,
            "vector_stores": vector_store_status["vector_stores"],
            "overall_status": vector_store_status["status"]
        }
        
        if vector_store_status["status"] == "error":
            health_data["status"] = "degraded"
            
        return health_data
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Health check failed: {str(e)}")   