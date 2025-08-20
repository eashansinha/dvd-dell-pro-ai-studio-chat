/*
 * Copyright © 2025 Dell Inc. or its subsidiaries. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { VectorStore } from '@langchain/core/vectorstores';

/**
 * Vector database configuration types and interfaces
 * Defines configuration structures for various vector database providers
 */

/**
 * Supported vector database types
 */
export type VectorDbType =
  | 'milvus' 
  | 'qdrant' 
  | 'weaviate' 
  | 'chroma'  // Deprecated/disabled due to compatibility issues
  | 'pgvector'
  | 'pinecone';

/**
 * Base configuration interface for vector database connections
 */
export interface BaseVectorDbConfig {
  id: string;
  name: string;
  description: string;
  type: VectorDbType;
  enabled: boolean;
  tags?: string[];
}

/**
 * Configuration interface for Milvus vector database
 */
export interface MilvusConfig extends BaseVectorDbConfig {
  type: 'milvus';
  url: string;
  port?: number;
  username?: string;
  password?: string;
  collection: string;
}

/**
 * Configuration interface for Qdrant vector database
 */
export interface QdrantConfig extends BaseVectorDbConfig {
  type: 'qdrant';
  url: string;
  apiKey?: string;
  collection: string;
}

/**
 * Configuration interface for Weaviate vector database
 */
export interface WeaviateConfig extends BaseVectorDbConfig {
  type: 'weaviate';
  url: string;
  apiKey?: string;
  className: string;
}

/**
 * Configuration interface for Chroma vector database
 */
export interface ChromaConfig extends BaseVectorDbConfig {
  type: 'chroma';
  url: string;
  collection: string;
}

/**
 * Configuration interface for PostgreSQL with pgvector extension
 */
export interface PGVectorConfig extends BaseVectorDbConfig {
  type: 'pgvector';
  connectionString: string;
  tableName: string;
  queryName?: string;
}

/**
 * Configuration interface for Pinecone vector database
 */
export interface PineconeConfig extends BaseVectorDbConfig {
  type: 'pinecone';
  apiKey: string;
  environment: string;
  index: string;
  namespace?: string;
}

/**
 * Union type of all vector database configurations
 */
export type VectorDbConfig = 
  | MilvusConfig 
  | QdrantConfig 
  | WeaviateConfig 
  | ChromaConfig 
  | PGVectorConfig
  | PineconeConfig;

/**
 * Interface representing a connection to a vector database
 */
export interface VectorDbConnection {
  config: VectorDbConfig;
  vectorStore?: VectorStore;
}    