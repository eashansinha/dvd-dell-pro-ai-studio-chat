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

import React, { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { 
  Clock, 
  Calendar, 
  FileText, 
  Tag, 
  File, 
  Tags, 
  Cloud, 
  Database 
} from 'lucide-react';
import { useAppSelector } from '../../store/store';
import { getDB } from '../../db/db';
import { ModelSelector } from '../ModelSelector/ModelSelector';
import './Header.css';

interface DocumentInfo {
  id: string;
  name: string;
  type: 'local' | 'backend' | 'collection';
}

export const Header: React.FC = () => {
  const { messages, currentSessionId } = useAppSelector(state => state.chat);
  const [documentTags, setDocumentTags] = useState<string[]>([]);
  const [docsCount, setDocsCount] = useState<number>(0);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo[]>([]);
  const [regularTags, setRegularTags] = useState<string[]>([]);

  // Get title from session in database
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!currentSessionId) return;

      try {
        const db = await getDB();
        const session = await db.sessions.findOne({
          selector: { sessionId: currentSessionId }
        }).exec();

        if (session) {
          
          // Get RAG information
          if (session.documentTags && session.documentTags.length > 0) {
            setDocumentTags(session.documentTags);
            
            // Separate document IDs, backend sources, collection sources and regular tags
            const docIds = new Set<string>();
            const regTags: string[] = [];
            const docInfos: DocumentInfo[] = [];
            
            session.documentTags.forEach(tag => {
              if (tag.startsWith('doc:')) {
                const docId = tag.substring(4);
                docIds.add(docId);
                docInfos.push({
                  id: docId,
                  name: docId.substring(0, 8) + '...',
                  type: 'local'
                });
              } else if (tag.startsWith('backend:')) {
                const parts = tag.split(':');
                const backendId = parts.length > 1 ? parts[1] : '';
                
                if (backendId) {
                  docIds.add(`backend-${backendId}`);
                  
                  // Add with format "Backend Store" or "Backend Store (n tags)"
                  const hasTags = parts.length > 2;
                  let tagList: string[] = [];
                  if (hasTags) {
                    tagList = parts[2].split(',');
                  }
                  
                  docInfos.push({
                    id: `backend-${backendId}`,
                    name: `Company Source${hasTags ? ` (${tagList.length} tags)` : ''}`,
                    type: 'backend'
                  });
                }
              } else if (tag.startsWith('collection:')) {
                const parts = tag.split(':');
                const collectionId = parts.length > 1 ? parts[1] : '';
                
                if (collectionId) {
                  docIds.add(`collection-${collectionId}`);
                  
                  // Add with format "Collection" or "Collection (n tags)"
                  const hasTags = parts.length > 2;
                  let tagList: string[] = [];
                  if (hasTags) {
                    tagList = parts[2].split(',');
                  }
                  
                  docInfos.push({
                    id: `collection-${collectionId}`,
                    name: `Company Collection${hasTags ? ` (${tagList.length} tags)` : ''}`,
                    type: 'collection'
                  });
                }
              } else {
                regTags.push(tag);
              }
            });
            
            setDocsCount(docIds.size);
            setRegularTags(regTags);
            
            // Fetch document names for local documents
            const localDocIds = Array.from(docIds).filter(id => 
              !id.startsWith('backend-') && !id.startsWith('collection-')
            );
            
            if (localDocIds.length > 0) {
              const docs = await db.documents.find({
                selector: {
                  id: {
                    $in: localDocIds
                  }
                }
              }).exec();
              
              // Update names for local documents
              const localDocInfoMap = new Map<string, string>();
              docs.forEach(doc => {
                localDocInfoMap.set(doc.id, doc.metadata.filename);
              });
              
              // Replace placeholder names with actual document names for local docs
              docInfos.forEach(info => {
                if (info.type === 'local' && localDocInfoMap.has(info.id)) {
                  info.name = localDocInfoMap.get(info.id) || info.name;
                }
              });
            }
            
            setDocumentInfo(docInfos);
          } else {
            setDocumentTags([]);
            setDocsCount(0);
            setDocumentInfo([]);
            setRegularTags([]);
          }
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
      }
    };

    fetchSessionData();
  }, [currentSessionId, messages.length]); // Re-fetch when messages change, in case title was updated

  // Format date/time for display
  const firstMessage = messages[0];
  const startTime = firstMessage ? new Date(firstMessage.timestamp) : new Date();
  const formattedDate = startTime.toLocaleDateString();
  const formattedTime = startTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Custom tooltip content for documents
  const DocsTooltipContent = () => (
    <div className="p-3 max-w-60 bg-popover border border-border rounded-md">
      {documentInfo.length > 0 ? (
        <div className="max-h-44 overflow-auto space-y-1">
          {documentInfo.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 py-1">
              <div className="min-w-6">
                {doc.type === 'local' ? (
                  <File className="h-4 w-4 text-primary" />
                ) : doc.type === 'backend' ? (
                  <Cloud className="h-4 w-4 text-secondary" />
                ) : (
                  <Database className="h-4 w-4 text-secondary" />
                )}
              </div>
              <span 
                className="text-sm text-foreground truncate" 
                title={doc.name}
              >
                {doc.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground px-2">
          No document info available
        </p>
      )}
    </div>
  );

  // Custom tooltip content for tags
  const TagsTooltipContent = () => (
    <div className="p-3 max-w-60 bg-popover border border-border rounded-md">
      {regularTags.length > 0 ? (
        <div className="max-h-36 overflow-auto space-y-1">
          {regularTags.map((tag, index) => (
            <div key={index} className="flex items-center gap-2 py-1">
              <div className="min-w-6">
                <Tags className="h-4 w-4 text-secondary" />
              </div>
              <span className="text-sm text-foreground">
                {tag}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground px-2">
          No tags available
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <header className="bg-background border-b border-border header">
        <div className="header-toolbar px-4 py-2">
          <div className="header-title-container">
            <div className="flex items-center">
              <ModelSelector />
              <Separator orientation="vertical" className="mx-2 h-6" />
              {messages.length > 0 && (
                <div className="flex items-center">
                  <div className="header-metadata flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="header-chip flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formattedDate}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Date Created</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="header-chip flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formattedTime}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Time Created</TooltipContent>
                    </Tooltip>

                    <Badge variant="outline" className="header-chip">
                      {`${messages.length} messages`}
                    </Badge>
                    
                    {/* Show RAG information when available */}
                    {documentTags.length > 0 && (
                      <>
                        <Separator orientation="vertical" className="mx-1 h-6" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="header-chip flex items-center gap-1 text-primary border-primary">
                              <FileText className="h-3 w-3" />
                              {`${docsCount} document${docsCount !== 1 ? 's' : ''}`}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <DocsTooltipContent />
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="header-chip flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {regularTags.length || 'Tags'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <TagsTooltipContent />
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};
