from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    version: str


class VectorStore(BaseModel):
    id: str
    name: str
    type: str
    description: str | None = None


class Collection(BaseModel):
    id: str
    name: str
    description: str | None = None
    tags: list[str] = []


class DocumentMetadata(BaseModel):
    documentId: str
    documentName: str
    chunkId: str
    chunkIndex: int | None = None
    tags: list[str] | None = None
    

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
    backend_ids: list[str] | None = None
    collection_ids: list[str] | None = None
    tags: list[str] | None = None   