from typing import Optional, Dict, Any
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str


class VectorStore(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str] = None


class Collection(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    tags: list[str] = []


class DocumentMetadata(BaseModel):
    documentId: str
    documentName: str
    chunkId: str
    chunkIndex: Optional[int] = None
    tags: Optional[list[str]] = None
    

class DocumentResponse(BaseModel):
    content: str
    metadata: DocumentMetadata
    source_id: str
    source_name: str
    source_type: str
    similarity: float


class SearchRequest(BaseModel):
    query: str
    k: int = 5
    backend_ids: Optional[list[str]] = None
    collection_ids: Optional[list[str]] = None
    tags: Optional[list[str]] = None     