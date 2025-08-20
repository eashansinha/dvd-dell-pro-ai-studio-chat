#!/usr/bin/env python3
"""
Load Mission Collections - A script to load NASA mission collections into pgvector
"""
import os
import json
import argparse
import subprocess
import logging
from dotenv import load_dotenv

# https://www.nasa.gov/history/afj/ap11fj/a11-documents.html

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('load_mission_collections')

def load_collections(collections_file, connection_string, table_name="documents", drop_tables=False, vector_store="pgvector"):
    """Load collections from a JSON file and process them"""
    
    # Load the collections file
    logger.info(f"Loading collections from {collections_file}")
    with open(collections_file, 'r') as f:
        data = json.load(f)
    
    collections = data.get('collections', [])
    logger.info(f"Found {len(collections)} collections")
    
    # Process each collection
    for collection in collections:
        collection_id = collection.get('id')
        collection_name = collection.get('name')
        collection_tags = collection.get('tags', [])
        pdf_urls = collection.get('urls', [])
        
        if not collection_id or not collection_name or not pdf_urls:
            logger.warning(f"Skipping incomplete collection: {collection}")
            continue
        
        logger.info(f"Processing collection: {collection_name} ({collection_id})")
        
        # Build command based on vector store type
        if vector_store.lower() == "qdrant":
            script_name = "pdf_to_qdrant.py"
            command = [
                "python", 
                os.path.join(os.path.dirname(__file__), script_name),
                "--collection", collection_id
            ]
        else:
            script_name = "pdf_to_pgvector.py"
            command = [
                "python", 
                os.path.join(os.path.dirname(__file__), script_name),
                "--collection-name", collection_name,
                "--collection-id", collection_id,
                "--connection-string", connection_string,
                "--table-name", table_name
            ]
        
        # Add drop-tables flag if requested (only for pgvector)
        if drop_tables and vector_store.lower() != "qdrant":
            command.append("--drop-tables")
        elif drop_tables and vector_store.lower() == "qdrant":
            command.append("--clear")
        
        # Add URLs
        for url in pdf_urls:
            command.extend(["--urls", url])
        
        # Add tags
        for tag in collection_tags:
            command.extend(["--tags", tag])
        
        # Run the command
        logger.info(f"Running command: {' '.join(command)}")
        try:
            subprocess.run(command, check=True)
            logger.info(f"Successfully processed collection: {collection_name}")
        except subprocess.CalledProcessError as e:
            logger.error(f"Error processing collection {collection_name}: {e}")

def parse_arguments():
    parser = argparse.ArgumentParser(description="Load NASA mission collections into vector database")
    
    parser.add_argument('--collections-file', type=str, 
                        default=os.path.join(os.path.dirname(__file__), "mission_collections.json"),
                        help='Path to the collections JSON file')
    
    parser.add_argument('--connection-string', type=str, 
                       default=os.getenv("PGVECTOR_CONNECTION_STRING", "postgresql://postgres:postgres@localhost:5432/vectordb"),
                       help='PostgreSQL connection string (for pgvector)')
    
    parser.add_argument('--table-name', type=str, 
                       default=os.getenv("PGVECTOR_TABLE_NAME", "documents"),
                       help='Name of the table to store documents (for pgvector)')
    
    parser.add_argument('--vector-store', type=str, choices=['pgvector', 'qdrant'], 
                       default='pgvector', help='Vector store to use (pgvector or qdrant)')
    
    parser.add_argument('--drop-tables', action='store_true', help='Drop existing tables/collections before processing')
    
    return parser.parse_args()

def main():
    args = parse_arguments()
    load_collections(
        collections_file=args.collections_file,
        connection_string=args.connection_string,
        table_name=args.table_name,
        drop_tables=args.drop_tables,
        vector_store=args.vector_store
    )

if __name__ == "__main__":
    main()    