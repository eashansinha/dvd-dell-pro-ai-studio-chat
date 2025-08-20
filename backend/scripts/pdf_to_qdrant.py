#!/usr/bin/env python3
"""
Script to process PDF files and load them into Qdrant vector database.
Adapted from pdf_to_pgvector.py for Qdrant compatibility.
"""

import os
import sys
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

sys.path.append(str(Path(__file__).parent.parent))

from app.config import (
    QDRANT_URL,
    QDRANT_API_KEY,
    QDRANT_COLLECTION_NAME,
    EMBEDDINGS_MODEL
)
from app.services.embeddings import embeddings_service

from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams


class QdrantService:
    """Service for loading documents into Qdrant vector database"""
    
    def __init__(self):
        self.embeddings = embeddings_service
        self.client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY if QDRANT_API_KEY else None
        )
        self.collection_name = QDRANT_COLLECTION_NAME
        
    def ensure_collection_exists(self):
        """Create collection if it doesn't exist"""
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                print(f"Creating collection '{self.collection_name}'...")
                test_embedding = self.embeddings.embed_query("test")
                dimension = len(test_embedding)
                
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=dimension, distance=Distance.COSINE)
                )
                print(f"Collection '{self.collection_name}' created successfully")
            else:
                print(f"Collection '{self.collection_name}' already exists")
                
        except Exception as e:
            print(f"Error ensuring collection exists: {e}")
            raise
    
    def load_documents(self, documents: List[Document], collection_id: str = None, tags: List[str] = None) -> int:
        """Load documents into Qdrant"""
        try:
            self.ensure_collection_exists()
            
            vector_store = QdrantVectorStore(
                client=self.client,
                collection_name=self.collection_name,
                embeddings=self.embeddings
            )
            
            processed_docs = []
            for i, doc in enumerate(documents):
                if not doc.metadata:
                    doc.metadata = {}
                
                doc.metadata.update({
                    "documentId": doc.metadata.get("documentId", str(uuid.uuid4())),
                    "chunkId": str(uuid.uuid4()),
                    "chunkIndex": i,
                    "collection": collection_id or "default",
                    "tags": tags or []
                })
                
                processed_docs.append(doc)
            
            vector_store.add_documents(processed_docs)
            
            print(f"Successfully loaded {len(processed_docs)} documents into Qdrant")
            return len(processed_docs)
            
        except Exception as e:
            print(f"Error loading documents into Qdrant: {e}")
            raise
    
    def clear_collection(self, collection_id: str = None):
        """Clear documents from collection"""
        try:
            if collection_id:
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector={
                        "filter": {
                            "must": [
                                {
                                    "key": "metadata.collection",
                                    "match": {"value": collection_id}
                                }
                            ]
                        }
                    }
                )
                print(f"Cleared collection '{collection_id}' from Qdrant")
            else:
                self.client.delete_collection(self.collection_name)
                print(f"Cleared entire Qdrant collection '{self.collection_name}'")
                
        except Exception as e:
            print(f"Error clearing Qdrant collection: {e}")
            raise


def process_pdf_file(file_path: str, collection_id: str = None, tags: List[str] = None) -> int:
    """Process a single PDF file and load it into Qdrant"""
    try:
        print(f"Processing PDF: {file_path}")
        
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        
        if not pages:
            print(f"No content found in PDF: {file_path}")
            return 0
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        documents = text_splitter.split_documents(pages)
        
        if not documents:
            print(f"No documents created from PDF: {file_path}")
            return 0
        
        document_name = Path(file_path).stem
        for doc in documents:
            if not doc.metadata:
                doc.metadata = {}
            doc.metadata.update({
                "documentName": document_name,
                "source": file_path,
                "collection": collection_id or "default",
                "tags": tags or []
            })
        
        qdrant_service = QdrantService()
        count = qdrant_service.load_documents(documents, collection_id, tags)
        
        print(f"Successfully processed {file_path}: {count} chunks loaded")
        return count
        
    except Exception as e:
        print(f"Error processing PDF {file_path}: {e}")
        raise


def main():
    """Main function to process PDF files"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Load PDF files into Qdrant vector database")
    parser.add_argument("pdf_path", help="Path to PDF file or directory containing PDFs")
    parser.add_argument("--collection", help="Collection ID for the documents")
    parser.add_argument("--tags", nargs="*", help="Tags to add to the documents")
    parser.add_argument("--clear", action="store_true", help="Clear collection before loading")
    
    args = parser.parse_args()
    
    try:
        if args.clear:
            qdrant_service = QdrantService()
            qdrant_service.clear_collection(args.collection)
        
        pdf_path = Path(args.pdf_path)
        total_chunks = 0
        
        if pdf_path.is_file() and pdf_path.suffix.lower() == '.pdf':
            total_chunks = process_pdf_file(str(pdf_path), args.collection, args.tags)
        elif pdf_path.is_dir():
            pdf_files = list(pdf_path.glob("*.pdf"))
            if not pdf_files:
                print(f"No PDF files found in directory: {pdf_path}")
                return
            
            for pdf_file in pdf_files:
                chunks = process_pdf_file(str(pdf_file), args.collection, args.tags)
                total_chunks += chunks
        else:
            print(f"Invalid path or not a PDF file: {pdf_path}")
            return
        
        print(f"\nTotal chunks loaded into Qdrant: {total_chunks}")
        
    except Exception as e:
        print(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
