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

import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Progress } from '../ui/progress';
import './DocumentReferences.css';
import { getDB } from '../../db/db';

export interface DocumentChunk {
  content?: string;
  documentName: string;
  similarity: number;
  documentId?: string;
  chunkId?: string;
  chunkIndex?: number;
}

interface DocumentReferencesProps {
  references: DocumentChunk[];
}

export const DocumentReferences: React.FC<DocumentReferencesProps> = ({ references }) => {
  const [expanded, setExpanded] = useState<number | false>(false);
  const [referencesWithContent, setReferences] = useState<DocumentChunk[]>(references);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const handleAccordionChange = (value: string) => {
    const panelIndex = parseInt(value);
    setExpanded(expanded === panelIndex ? false : panelIndex);
  };

  // Load content for all chunks when the component mounts or references change
  useEffect(() => {
    const loadAllContent = async () => {
      setIsLoading(true);
      
      try {
        const db = await getDB();
        const updatedRefs = [...referencesWithContent];
        let hasUpdates = false;
        
        for (let i = 0; i < updatedRefs.length; i++) {
          const ref = updatedRefs[i];
          // Skip if content is already present
          if (ref.content) {
            continue;
          }
          
          if (ref.chunkId) {
            // console.log(`Loading content for chunk ${i+1}/${updatedRefs.length}: ${ref.chunkId} (index: ${ref.chunkIndex})`);
            
            // Use chunkId for exact lookup
            const chunk = await db.documentChunks.findOne({
              selector: { id: { $eq: ref.chunkId } }
            }).exec();
            
            if (chunk) {
              updatedRefs[i] = { ...ref, content: chunk.content };
              hasUpdates = true;
              // console.log(`Content loaded successfully for chunk ${ref.chunkId}`);
            } else {
              console.warn(`Chunk not found: ${ref.chunkId}, trying alternate lookup`);
              
              // Fallback if needed
              if (ref.documentId) {
                // Try to find chunks by documentId and chunkIndex if available
                const selector = ref.chunkIndex !== undefined 
                  ? { documentId: ref.documentId, chunkIndex: ref.chunkIndex }
                  : { documentId: ref.documentId };
                  
                const altChunk = await db.documentChunks.findOne({ selector }).exec();
                
                if (altChunk) {
                  updatedRefs[i] = { ...ref, content: altChunk.content };
                  hasUpdates = true;
                  console.log(`Content loaded via alternate lookup`);
                }
              }
            }
          }
        }
        
        if (hasUpdates) {
          setReferences(updatedRefs);
        }
      } catch (error) {
        console.error("Error loading chunk contents:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only load if we have references with chunkIds and no content
    if (referencesWithContent.some(ref => !ref.content && ref.chunkId)) {
      loadAllContent();
    } else {
      // No loading needed, all content is already available
      setIsLoading(false);
    }
  }, [references]);

  useEffect(() => {
    // Initialize state with references that may already have content
    if (references !== referencesWithContent) {
      console.log('References changed, updating state...');
      
      // Check if any references already have content
      const hasUpdates = references.some((ref, idx) => 
        ref.content !== referencesWithContent[idx]?.content
      );
      
      if (hasUpdates || references.length !== referencesWithContent.length) {
        console.log('Updated references with new content');
        setReferences(references);
      }
      
      // If any reference is missing content, set loading state
      setIsLoading(references.some(ref => !ref.content && ref.chunkId));
    }
  }, [references]);

  if (!references || references.length === 0) {
    return null;
  }

  // Group references by document name
  const documentGroups = referencesWithContent.reduce((groups, ref) => {
    if (!groups[ref.documentName]) {
      groups[ref.documentName] = [];
    }
    groups[ref.documentName].push(ref);
    return groups;
  }, {} as Record<string, DocumentChunk[]>);
  
  // console.log("Document groups:", Object.keys(documentGroups).map(name => ({
  //   name,
  //   chunks: documentGroups[name].map(c => ({
  //     chunkId: c.chunkId,
  //     chunkIndex: c.chunkIndex,
  //     hasContent: !!c.content,
  //     contentLength: c.content?.length || 0
  //   }))
  // })));

  // console.log("documentGroups", documentGroups)

  return (
    <Card className="mt-4 border border-border rounded-lg">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center">
          <h3 className="text-sm font-medium flex-grow">References</h3>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          )}
        </div>
      </CardHeader>
      <Separator />
      
      <CardContent className="p-0">
        <Accordion 
          type="single" 
          collapsible 
          value={expanded !== false ? expanded.toString() : undefined}
          onValueChange={handleAccordionChange}
        >
          {Object.entries(documentGroups).map(([docName, chunks], docIndex) => (
            <AccordionItem key={docIndex} value={docIndex.toString()} className="border-b last:border-b-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="document-header flex items-center gap-2 w-full">
                  <FileText className="h-4 w-4 doc-icon flex-shrink-0" />
                  <span className="doc-name text-sm font-medium flex-grow text-left truncate">
                    {docName}
                  </span>
                  <Badge variant="secondary" className="chunk-count text-xs">
                    {chunks.length} {chunks.length === 1 ? 'chunk' : 'chunks'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {chunks.map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="chunk-container">
                    <div className="chunk-header mb-2">
                      <p className="text-xs text-muted-foreground whitespace-pre-line break-words">
                        {chunk.chunkIndex !== undefined 
                          ? `Chunk ${chunk.chunkIndex + 1}` 
                          : `Chunk ${chunkIndex + 1}`} • Similarity: {(chunk.similarity * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="chunk-content mb-3">
                      {!chunk.content && (
                        <p className="text-sm text-muted-foreground italic">
                          {isLoading ? "Loading content..." : "Content not available"}
                        </p>
                      )}
                      {chunk.content && (
                        <p className="text-sm leading-relaxed">
                          {chunk.content}
                        </p>
                      )}
                    </div>
                    <div className="chunk-relevance flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">
                        Relevance: {chunk.similarity > 0.9 ? 'Very High' : 
                                   chunk.similarity > 0.8 ? 'High' : 
                                   chunk.similarity > 0.7 ? 'Medium' : 'Low'}
                      </span>
                      <Progress 
                        value={chunk.similarity * 100} 
                        className="w-24 h-1"
                      />
                    </div>
                    {chunkIndex < chunks.length - 1 && <Separator className="chunk-divider my-3" />}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};      