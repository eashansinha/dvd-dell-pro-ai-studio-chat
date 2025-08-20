import logging
from typing import Any

logger = logging.getLogger(__name__)


class VectorStoreError(Exception):
    """Base exception for vector store operations"""
    
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)
        logger.error(f"VectorStoreError: {message}", extra=self.details)


class DatabaseConnectionError(VectorStoreError):
    """Exception raised when database connection fails"""
    pass


class EmbeddingError(VectorStoreError):
    """Exception raised when embedding generation fails"""
    pass


class SearchError(VectorStoreError):
    """Exception raised when search operations fail"""
    pass
