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
 * RAG (Retrieval-Augmented Generation) context for managing document references
 * Provides state management for document chunks and RAG functionality status
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DocumentReferences } from '../components/DocumentReferences/DocumentReferences';

/**
 * Interface for document chunks used in RAG responses
 */
export interface DocumentChunk {
  content: string;
  documentName: string;
  similarity: number;
}

/**
 * Type definition for RAG context value
 */
interface RagContextType {
  references: DocumentChunk[];
  setReferences: (refs: DocumentChunk[]) => void;
  isUsingRag: boolean;
  setIsUsingRag: (value: boolean) => void;
}

/**
 * RAG context instance
 */
const RagContext = createContext<RagContextType | undefined>(undefined);

/**
 * RAG provider component that manages document references and RAG state
 * @param props - Component props containing child components
 * @returns JSX element providing RAG context to children
 */
export const RagProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [references, setReferences] = useState<DocumentChunk[]>([]);
  const [isUsingRag, setIsUsingRag] = useState(false);
  
  return (
    <RagContext.Provider value={{ references, setReferences, isUsingRag, setIsUsingRag }}>
      {children}
    </RagContext.Provider>
  );
};

/**
 * Custom hook to access RAG context
 * @returns RAG context value with references and state management functions
 * @throws Error if used outside of RagProvider
 */
export const useRag = () => {
  const context = useContext(RagContext);
  if (context === undefined) {
    throw new Error('useRag must be used within a RagProvider');
  }
  return context;
};   