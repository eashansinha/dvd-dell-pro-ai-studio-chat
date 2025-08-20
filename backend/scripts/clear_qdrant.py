#!/usr/bin/env python3
"""
Script to clear Qdrant vector database collections.
Adapted from clear_vector_db.py for Qdrant compatibility.
"""

import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.config import (
    QDRANT_URL,
    QDRANT_API_KEY,
    QDRANT_COLLECTION_NAME
)

from qdrant_client import QdrantClient


def clear_qdrant_collection(collection_name: str = None, collection_id: str = None):
    """Clear Qdrant collection or specific documents"""
    try:
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY if QDRANT_API_KEY else None
        )
        
        collection_name = collection_name or QDRANT_COLLECTION_NAME
        
        if collection_id:
            print(f"Clearing documents with collection_id '{collection_id}' from Qdrant collection '{collection_name}'...")
            
            points_to_delete = []
            scroll_result = client.scroll(
                collection_name=collection_name,
                scroll_filter={
                    "must": [
                        {
                            "key": "metadata.collection",
                            "match": {"value": collection_id}
                        }
                    ]
                },
                limit=1000,
                with_payload=False
            )
            
            points_to_delete.extend([point.id for point in scroll_result[0]])
            
            next_page_offset = scroll_result[1]
            while next_page_offset:
                scroll_result = client.scroll(
                    collection_name=collection_name,
                    scroll_filter={
                        "must": [
                            {
                                "key": "metadata.collection",
                                "match": {"value": collection_id}
                            }
                        ]
                    },
                    limit=1000,
                    with_payload=False,
                    offset=next_page_offset
                )
                points_to_delete.extend([point.id for point in scroll_result[0]])
                next_page_offset = scroll_result[1]
            
            if points_to_delete:
                client.delete(
                    collection_name=collection_name,
                    points_selector=points_to_delete
                )
                print(f"Deleted {len(points_to_delete)} documents with collection_id '{collection_id}'")
            else:
                print(f"No documents found with collection_id '{collection_id}'")
        else:
            print(f"Clearing entire Qdrant collection '{collection_name}'...")
            
            collections = client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if collection_name in collection_names:
                client.delete_collection(collection_name)
                print(f"Successfully cleared Qdrant collection '{collection_name}'")
            else:
                print(f"Collection '{collection_name}' does not exist")
        
    except Exception as e:
        print(f"Error clearing Qdrant collection: {e}")
        raise


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Clear Qdrant vector database")
    parser.add_argument("--collection-name", help="Name of the Qdrant collection to clear")
    parser.add_argument("--collection-id", help="Clear only documents with this collection ID")
    parser.add_argument("--confirm", action="store_true", help="Skip confirmation prompt")
    
    args = parser.parse_args()
    
    collection_name = args.collection_name or QDRANT_COLLECTION_NAME
    
    if not args.confirm:
        if args.collection_id:
            confirm_msg = f"Are you sure you want to clear documents with collection_id '{args.collection_id}' from Qdrant collection '{collection_name}'? (y/N): "
        else:
            confirm_msg = f"Are you sure you want to clear the entire Qdrant collection '{collection_name}'? This will delete ALL data! (y/N): "
        
        response = input(confirm_msg)
        if response.lower() != 'y':
            print("Operation cancelled.")
            return
    
    try:
        clear_qdrant_collection(collection_name, args.collection_id)
        print("Qdrant clear operation completed successfully.")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
