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

/**
 * Database schema types and interfaces for RxDB collections
 * Defines the structure for sessions, messages, documents, and document chunks
 */

/* eslint-disable @typescript-eslint/no-empty-object-type */
import {
    RxDocument,
    RxCollection,
    RxDatabase,
  } from 'rxdb';
  
/**
 * Metrics for message performance tracking including timing and token information
 */
export interface MessageMetrics {
    processingTimeMs?: number;
    tokensGenerated?: number;
    wordsGenerated?: number;
    tokensPerSecond?: number;
    startTime?: number;
    endTime?: number;
  }
  
/**
 * Reference to a document used in RAG (Retrieval-Augmented Generation) responses
 */
export interface DocumentReference {
    documentId: string;     // ID of the document
    documentName: string;   // Name for display
    chunkId: string;        // ID to look up the chunk in the document-chunk db
    chunkIndex?: number;    // Index of the chunk in the document (for UI reference)
    similarity?: number;     // Similarity score
    sourceType?: string;    // Type of source (local or vdb)
    content?: string;        // Document content
  }
  
/**
 * Type definition for chat message documents stored in the database
 */
export interface MessageDocType {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: number;
    thinkingContent?: string;
    embedding?: number[];
    metrics?: MessageMetrics;
    documentReferences?: DocumentReference[];
    model?: string;
    conversationId?: string;
  }
  
  /**
   * RxDocument for messages.
   */
  export type MessageDocument = RxDocument<MessageDocType>;
  
/**
 * Collection methods for message database operations
 */
export interface MessageCollectionMethods {
    // e.g., getVector(): number[];
  }
  
/**
 * Type definition for chat session documents stored in the database
 */
export interface SessionDocType {
    sessionId: string;
    createdAt: number;
    lastUpdated: number;
    title: string;
    messages: string[]; // store IDs referencing the messages collection
    documentTags?: string[]; // Tags for document references
  }
  
  /**
   * RxDocument for a session.
   */
  export type SessionDocument = RxDocument<SessionDocType>;
  
  /**
   * Optional custom methods for the sessions collection.
   */
/**
 * Collection methods for session database operations
 */
export interface SessionCollectionMethods {
    // e.g., addMessageId(msgId: string): void;
  }
  
/**
 * Metadata for uploaded documents including file information and processing details
 */
export interface DocumentMetadata {
    filename: string;
    mimetype: string;
    size: number;
    uploadDate: number;
    tags: string[];
    chunkCount: number;
  }
  
/**
 * Type definition for uploaded document records
 */
export interface DocumentDocType {
    id: string;
    content: string;
    metadata: DocumentMetadata;
  }
  
  /**
   * RxDocument for documents
   */
  export type DocumentDocument = RxDocument<DocumentDocType>;
  
  /**
   * Interface for document methods
   */
/**
 * Collection methods for document database operations
 */
export interface DocumentCollectionMethods {
    // Future methods
  }
  
/**
 * Metadata for document chunks including source information and positioning
 */
export interface DocumentChunkMetadata {
    documentName: string;
    documentType: string;
    tags: string[];
    pageNumber?: number;
    section?: string;
  }
  
/**
 * Type definition for document chunk records with embeddings
 */
export interface DocumentChunkDocType {
    id: string;
    documentId: string;
    content: string;
    embedding: number[];
    chunkIndex: number;
    metadata: DocumentChunkMetadata;
  }
  
  /**
   * RxDocument for document chunks
   */
  export type DocumentChunkDocument = RxDocument<DocumentChunkDocType>;
  
  /**
   * Interface for document chunk methods
   */
/**
 * Collection methods for document chunk database operations
 */
export interface DocumentChunkCollectionMethods {
    // Future methods
  }
  
/**
 * Main database collections interface defining all RxDB collections
 */
export interface ChatDatabaseCollections {
    messages: RxCollection<MessageDocType, MessageCollectionMethods>;
    sessions: RxCollection<SessionDocType, SessionCollectionMethods>;
    documents: RxCollection<DocumentDocType, DocumentCollectionMethods>;
    documentChunks: RxCollection<DocumentChunkDocType, DocumentChunkCollectionMethods>;
  }
  
  /**
   * The main ChatDB type.
   */
  export type ChatDB = RxDatabase<ChatDatabaseCollections>;
