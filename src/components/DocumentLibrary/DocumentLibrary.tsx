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
import { 
  Folder, 
  Upload, 
  Plus, 
  Trash, 
  MessageSquare, 
  Search, 
  Loader2,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { List, ListItem, ListItemText } from '../ui/list';
import { Autocomplete } from '../ui/autocomplete';
import { Progress } from '../ui/progress';
import { DocumentManager } from '../../services/DocumentManager';
import { DocumentDocType } from '../../db/types';
import { getDB } from '../../db/db';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { startSession } from '../../store/store';
import { v4 as uuidv4 } from 'uuid';
import './DocumentLibrary.css';

// EmbeddingProgress interface similar to DocumentUpload
interface EmbeddingProgress {
  processedChunks: number;
  totalChunks: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  chunkProcessingRate: number;
  currentFile?: string;
}

// Add the formatTime function to format time display
const formatTime = (milliseconds: number): string => {
  if (!milliseconds || milliseconds <= 0) return '0s';
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const DocumentLibrary: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentSessionId = useAppSelector(state => state.chat.currentSessionId);
  const [documents, setDocuments] = useState<DocumentDocType[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewDocument, setViewDocument] = useState<DocumentDocType | null>(null);
  const [currentSessionTags, setCurrentSessionTags] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    docId: string | null;
  } | null>(null);
  const [tagContextMenu, setTagContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    tag: string;
  } | null>(null);
  
  // Add this constant for our special tag prefix
  const DOCUMENT_REF_PREFIX = "doc:";
  
  // Add the embeddingProgress state
  const [embeddingProgress, setEmbeddingProgress] = useState<EmbeddingProgress | null>(null);
  
  // Load documents and tags
  useEffect(() => {
    loadDocuments();
    loadAllTags();
    
    if (currentSessionId) {
      loadSessionTags(currentSessionId);
    }
  }, [currentSessionId]);
  
  const loadDocuments = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const docs = await db.documents.find().exec();
      const docList = docs.map(doc => doc.toJSON() as DocumentDocType);
      
      // Filter by search term if any
      const filtered = searchTerm
        ? docList.filter(doc => 
            doc.metadata.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : docList;
        
      setDocuments(filtered);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadAllTags = async () => {
    try {
      const tags = await DocumentManager.getAllTags();
      setAllTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };
  
  const loadSessionTags = async (sessionId: string) => {
    try {
      const db = await getDB();
      const session = await db.sessions.findOne({
        selector: { sessionId }
      }).exec();
      
      if (session) {
        setCurrentSessionTags(session.documentTags || []);
      }
    } catch (error) {
      console.error('Error loading session tags:', error);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };
  
  const handleAddTag = () => {
    if (newTag && !uploadTags.includes(newTag)) {
      setUploadTags([...uploadTags, newTag]);
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setUploadTags(uploadTags.filter(tag => tag !== tagToRemove));
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setEmbeddingProgress(null);
    
    try {
      // Update progress with file information
      setEmbeddingProgress({
        processedChunks: 0,
        totalChunks: 0,
        elapsedTime: 0,
        estimatedTimeRemaining: 0,
        chunkProcessingRate: 0,
        currentFile: selectedFile.name
      });
      
      // Pass the progress callback to uploadDocument
      await DocumentManager.uploadDocument(
        selectedFile, 
        uploadTags,
        (progress) => {
          setEmbeddingProgress({
            ...progress,
            currentFile: selectedFile.name
          });
        }
      );
      
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadTags([]);
      setEmbeddingProgress(null);
      
      // Refresh documents and tags
      await loadDocuments();
      await loadAllTags();
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteDocument = async (id: string) => {
    try {
      await DocumentManager.deleteDocument(id);
      setConfirmDeleteId(null);
      await loadDocuments();
      await loadAllTags();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };
  
  const handleAddTagToSession = async (tag: string) => {
    if (!currentSessionId || currentSessionTags.includes(tag)) return;
    
    try {
      const db = await getDB();
      const session = await db.sessions.findOne({
        selector: { sessionId: currentSessionId }
      }).exec();
      
      if (session) {
        const updatedTags = [...currentSessionTags, tag];
        await session.update({
          $set: { documentTags: updatedTags }
        });
        setCurrentSessionTags(updatedTags);
      }
    } catch (error) {
      console.error('Error adding tag to session:', error);
    }
  };
  
  const handleRemoveTagFromSession = async (tag: string) => {
    if (!currentSessionId) return;
    
    try {
      const db = await getDB();
      const session = await db.sessions.findOne({
        selector: { sessionId: currentSessionId }
      }).exec();
      
      if (session) {
        const updatedTags = currentSessionTags.filter(t => t !== tag);
        await session.update({
          $set: { documentTags: updatedTags }
        });
        setCurrentSessionTags(updatedTags);
      }
    } catch (error) {
      console.error('Error removing tag from session:', error);
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };
  
  const handleContextMenu = (event: React.MouseEvent, docId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      docId
    });
  };
  
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
  const handleTagContextMenu = (event: React.MouseEvent, tag: string) => {
    event.preventDefault();
    event.stopPropagation();
    setTagContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      tag
    });
  };
  
  const handleCloseTagContextMenu = () => {
    setTagContextMenu(null);
  };
  
  // New functions to support chat with document/tag
  const startChatWithDocument = async (documentId: string) => {
    try {
      // Find the document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return;
      
      // Create a new chat session
      const newSessionId = uuidv4();
      dispatch(startSession(newSessionId));
      
      // Get tags from the document
      const docTags = document.metadata.tags;
      
      // Add document tags to the session
      const db = await getDB();
      const session = await db.sessions.findOne({
        selector: { sessionId: newSessionId }
      }).exec();
      
      if (session) {
        await session.update({
          $set: { 
            documentTags: docTags,
            title: `Chat about ${document.metadata.filename}`
          }
        });
      }
    } catch (error) {
      console.error('Error starting chat with document:', error);
    }
  };
  
  const startChatWithTag = async (tag: string) => {
    try {
      // Create a new chat session
      const newSessionId = uuidv4();
      dispatch(startSession(newSessionId));
      
      // Add the tag to the session
      const db = await getDB();
      const session = await db.sessions.findOne({
        selector: { sessionId: newSessionId }
      }).exec();
      
      if (session) {
        await session.update({
          $set: { 
            documentTags: [tag],
            title: `Chat about ${tag}`
          }
        });
      }
    } catch (error) {
      console.error('Error starting chat with tag:', error);
    }
  };
  
  // Update this function to create a special tag for the document
  const addDocumentToCurrentChat = async (documentId: string) => {
    if (!currentSessionId) return;
    
    try {
      // Find the document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return;
      
      // Create a special document reference tag
      const documentRefTag = `${DOCUMENT_REF_PREFIX}${documentId}`;
      
      // Get current session
      const db = await getDB();
      const session = await db.sessions.findOne({
        selector: { sessionId: currentSessionId }
      }).exec();
      
      if (session) {
        // Check if document is already referenced
        const existingTags = currentSessionTags || [];
        if (existingTags.includes(documentRefTag)) {
          return; // Document already added
        }
        
        // Add the document reference tag
        const newTags = [...existingTags, documentRefTag];
        
        // Update session with new tags
        await session.update({
          $set: { documentTags: newTags }
        });
        
        // Update local state
        setCurrentSessionTags(newTags);
      }
    } catch (error) {
      console.error('Error adding document to current chat:', error);
    }
  };
  
  // Add this function to remove a document from the chat
  const removeDocumentFromChat = async (documentId: string) => {
    if (!currentSessionId) return;
    
    try {
      const documentRefTag = `${DOCUMENT_REF_PREFIX}${documentId}`;
      
      // Get current session
      const db = await getDB();
      const session = await db.sessions.findOne({
        selector: { sessionId: currentSessionId }
      }).exec();
      
      if (session) {
        // Remove the document reference tag
        const updatedTags = currentSessionTags.filter(tag => tag !== documentRefTag);
        
        // Update session
        await session.update({
          $set: { documentTags: updatedTags }
        });
        
        // Update local state
        setCurrentSessionTags(updatedTags);
      }
    } catch (error) {
      console.error('Error removing document from chat:', error);
    }
  };
  
  // Update this function to check for direct document references
  const isDocumentInCurrentChat = (doc: DocumentDocType): boolean => {
    if (!currentSessionId || !currentSessionTags.length) return false;
    
    // Check for direct document reference
    const documentRefTag = `${DOCUMENT_REF_PREFIX}${doc.id}`;
    if (currentSessionTags.includes(documentRefTag)) {
      return true;
    }
    
    // Fall back to checking if all document tags are included
    if (doc.metadata.tags.length === 0) return false;
    return doc.metadata.tags.every(tag => currentSessionTags.includes(tag));
  };
  
  // Add a helper to check if a document is directly referenced
  const isDocumentDirectlyReferenced = (docId: string): boolean => {
    if (!currentSessionId || !currentSessionTags.length) return false;
    const documentRefTag = `${DOCUMENT_REF_PREFIX}${docId}`;
    return currentSessionTags.includes(documentRefTag);
  };
  
  // Helper to get regular tags (not document references)
  const getRegularTags = (): string[] => {
    return currentSessionTags.filter(tag => !tag.startsWith(DOCUMENT_REF_PREFIX));
  };
  
  // Helper to get document IDs from tags
  const getReferencedDocumentIds = (): string[] => {
    return currentSessionTags
      .filter(tag => tag.startsWith(DOCUMENT_REF_PREFIX))
      .map(tag => tag.substring(DOCUMENT_REF_PREFIX.length));
  };
  
  // Get documents that are directly referenced
  const getReferencedDocuments = (): DocumentDocType[] => {
    const documentIds = getReferencedDocumentIds();
    return documents.filter(doc => documentIds.includes(doc.id));
  };
  
  return (
    <div className="document-library flex flex-col h-full overflow-hidden">
      <div className="flex flex-col justify-between mb-4 gap-2">
        <Button
          variant="default"
          className="w-full"
          size="lg"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Add Local Document
        </Button>
        
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
          />
        </div>
      </div>
      
      {currentSessionId && (
        <div className="session-tags">
          <h3 className="text-sm font-medium mb-2">
            Current Chat References:
          </h3>
          
          {currentSessionTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No document references added
            </p>
          ) : (
            <>
              {/* Direct document references */}
              {getReferencedDocuments().length > 0 && (
                <div className="referenced-documents">
                  <p className="text-sm mt-2 mb-1">
                    Documents:
                  </p>
                  <div className="tag-chips flex flex-wrap gap-1">
                    {getReferencedDocuments().map(doc => (
                      <Badge
                        key={`doc-${doc.id}`}
                        variant="secondary"
                        className="font-medium flex items-center gap-1 pr-1"
                      >
                        <Folder className="h-3 w-3 mr-1" />
                        {doc.metadata.filename}
                        <button 
                          className="ml-1 rounded-full hover:bg-secondary-foreground/10"
                          onClick={() => removeDocumentFromChat(doc.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {getRegularTags().length > 0 && (
                <div className="tag-references">
                  <p className="text-sm mt-2 mb-1">
                    Tags:
                  </p>
                  <div className="tag-chips flex flex-wrap gap-1">
                    {getRegularTags().map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="flex items-center gap-1 pr-1"
                        onContextMenu={(e) => handleTagContextMenu(e, tag)}
                      >
                        {tag}
                        <button 
                          className="ml-1 rounded-full hover:bg-muted"
                          onClick={() => handleRemoveTagFromSession(tag)}
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="mt-2">
            <Autocomplete
              options={allTags.filter(tag => !currentSessionTags.includes(tag))}
              onChange={(value) => value && handleAddTagToSession(value)}
              placeholder="Add tag reference..."
              className="tag-autocomplete"
              size="sm"
            />
          </div>
        </div>
      )}
      
      <Separator className="my-2" />
      
      <h3 className="text-sm font-medium mb-2">
        Your Documents
      </h3>
      
      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No documents found
        </p>
      ) : (
        <List className="overflow-y-auto flex-grow">
          {documents.map(doc => (
            <ListItem
              key={doc.id}
              className={`mb-1 rounded-md transition-colors duration-200 relative ${
                isDocumentInCurrentChat(doc) && !isDocumentDirectlyReferenced(doc.id) 
                  ? 'bg-primary/10 border-l-4 border-primary' 
                  : isDocumentDirectlyReferenced(doc.id)
                    ? 'bg-secondary/10 border-l-4 border-secondary'
                    : ''
              }`}
              onClick={() => setViewDocument(doc)}
              onContextMenu={(e) => handleContextMenu(e, doc.id)}
            >
              <Folder className="mr-2 h-5 w-5 text-muted-foreground" />
              <ListItemText
                primary={doc.metadata.filename}
                secondary={
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(doc.metadata.uploadDate)} · {formatSize(doc.metadata.size)}
                      {isDocumentDirectlyReferenced(doc.id) && currentSessionId && (
                        <span className="ml-1 text-xs font-bold text-secondary">
                          • Direct reference
                        </span>
                      )}
                      {isDocumentInCurrentChat(doc) && !isDocumentDirectlyReferenced(doc.id) && currentSessionId && (
                        <span className="ml-1 text-xs font-bold text-primary">
                          • Via tags
                        </span>
                      )}
                    </span>
                    <div className="document-item-tags flex flex-wrap gap-1 mt-1">
                      {doc.metadata.tags.slice(0, 3).map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="document-tag text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentSessionId && !currentSessionTags.includes(tag)) {
                              handleAddTagToSession(tag);
                            }
                          }}
                          onContextMenu={(e) => handleTagContextMenu(e, tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {doc.metadata.tags.length > 3 && (
                        <Badge
                          variant="outline"
                          className="document-tag text-xs"
                        >
                          +{doc.metadata.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                }
              />
              {currentSessionId && (
                <div className="document-actions" onClick={(e) => e.stopPropagation()}>
                  {isDocumentDirectlyReferenced(doc.id) ? (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-secondary"
                      onClick={() => removeDocumentFromChat(doc.id)}
                      title="Remove from chat"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-primary"
                      onClick={() => addDocumentToCurrentChat(doc.id)}
                      title="Add to current chat"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Local Document</DialogTitle>
          </DialogHeader>
          <div className="upload-content space-y-4">
            <Button
              variant="outline"
              className="file-select-button w-full"
              asChild
            >
              <label>
                <Upload className="mr-2 h-4 w-4" />
                Select File
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".txt,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.md,.js,.ts,.py,.java,.html,.css,.json,.xml"
                />
              </label>
            </Button>
            
            {selectedFile && (
              <p className="text-sm text-muted-foreground selected-file">
                Selected: {selectedFile.name} ({formatSize(selectedFile.size)})
              </p>
            )}
            
            <h4 className="text-sm font-medium tags-heading">
              Add Tags
            </h4>
            
            <div className="tag-input flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Enter tag name"
                className="tag-field flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag}
              >
                Add
              </Button>
            </div>
            
            <div className="upload-tags flex flex-wrap gap-1">
              {uploadTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="upload-tag flex items-center gap-1 pr-1"
                >
                  {tag}
                  <button 
                    className="ml-1 rounded-full hover:bg-secondary-foreground/10"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            {/* Embedding Progress Section */}
            {embeddingProgress && (
              <div className="embedding-progress-container space-y-2">
                <div className="progress-header flex justify-between">
                  <p className="text-sm">
                    <span className="chunk-pulse inline-block w-2 h-2 bg-primary rounded-full animate-pulse mr-2"></span>
                    Processing {embeddingProgress.currentFile}
                  </p>
                  <p className="text-sm">
                    {embeddingProgress.processedChunks}/{embeddingProgress.totalChunks} chunks
                  </p>
                </div>
                
                <Progress 
                  value={embeddingProgress.totalChunks > 0 
                    ? (embeddingProgress.processedChunks / embeddingProgress.totalChunks) * 100 
                    : 0
                  }
                  className="w-full"
                />
                
                <div className="progress-stats flex justify-between text-xs text-muted-foreground">
                  <span>
                    Time elapsed: {formatTime(embeddingProgress.elapsedTime)}
                  </span>
                  
                  <span>
                    {embeddingProgress.chunkProcessingRate.toFixed(1)} chunks/sec
                  </span>
                  
                  <span>
                    Est. remaining: {formatTime(embeddingProgress.estimatedTimeRemaining)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading && !embeddingProgress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? 'Embedding Document...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Document Dialog */}
      <Dialog open={viewDocument !== null} onOpenChange={(open) => !open && setViewDocument(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {viewDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{viewDocument.metadata.filename}</DialogTitle>
                <DialogDescription>
                  {formatDate(viewDocument.metadata.uploadDate)} · {formatSize(viewDocument.metadata.size)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                <div className="document-tags-header mb-4 flex flex-wrap gap-1">
                  <TooltipProvider>
                    {viewDocument.metadata.tags.map(tag => (
                      <Tooltip 
                        key={tag}
                      >
                        <TooltipTrigger asChild>
                          <Badge
                            variant={currentSessionTags.includes(tag) ? "default" : "outline"}
                            className={`view-tag cursor-pointer ${currentSessionTags.includes(tag) ? 'active-tag' : ''}`}
                            onClick={() => {
                              if (!currentSessionId) return;
                              
                              if (currentSessionTags.includes(tag)) {
                                handleRemoveTagFromSession(tag);
                              } else {
                                handleAddTagToSession(tag);
                              }
                            }}
                            onContextMenu={(e) => handleTagContextMenu(e, tag)}
                          >
                            {tag}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {currentSessionId ? (
                            currentSessionTags.includes(tag) 
                              ? "Remove from current chat" 
                              : "Add to current chat"
                          ) : "Right click to chat with this tag"}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
                <div className="document-preview">
                  <pre className="whitespace-pre-wrap text-sm">{viewDocument.content}</pre>
                </div>
              </div>
              <DialogFooter className="flex-wrap gap-2">
                {currentSessionId && (
                  isDocumentDirectlyReferenced(viewDocument.id) ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        removeDocumentFromChat(viewDocument.id);
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Remove from current chat
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        addDocumentToCurrentChat(viewDocument.id);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add to current chat
                    </Button>
                  )
                )}
                <Button 
                  onClick={() => {
                    startChatWithDocument(viewDocument.id);
                    setViewDocument(null);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start new chat with document
                </Button>
                <Button variant="outline" onClick={() => setViewDocument(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Document Context Menu */}
      <DropdownMenu open={contextMenu !== null} onOpenChange={(open) => !open && handleCloseContextMenu()}>
        <DropdownMenuTrigger asChild>
          <div 
            style={{
              position: 'fixed',
              top: contextMenu?.mouseY || 0,
              left: contextMenu?.mouseX || 0,
              width: 1,
              height: 1,
              pointerEvents: 'none'
            }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {currentSessionId && contextMenu?.docId && (
            isDocumentDirectlyReferenced(contextMenu.docId) ? (
              <DropdownMenuItem 
                onClick={() => {
                  removeDocumentFromChat(contextMenu.docId!);
                  handleCloseContextMenu();
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Remove from current chat
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => {
                  addDocumentToCurrentChat(contextMenu.docId!);
                  handleCloseContextMenu();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to current chat
              </DropdownMenuItem>
            )
          )}
          <DropdownMenuItem 
            onClick={() => {
              if (contextMenu?.docId) {
                startChatWithDocument(contextMenu.docId);
                handleCloseContextMenu();
              }
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Start new chat with document
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              if (contextMenu?.docId) {
                setConfirmDeleteId(contextMenu.docId);
                handleCloseContextMenu();
              }
            }}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Tag Context Menu */}
      <DropdownMenu open={tagContextMenu !== null} onOpenChange={(open) => !open && handleCloseTagContextMenu()}>
        <DropdownMenuTrigger asChild>
          <div 
            style={{
              position: 'fixed',
              top: tagContextMenu?.mouseY || 0,
              left: tagContextMenu?.mouseX || 0,
              width: 1,
              height: 1,
              pointerEvents: 'none'
            }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem 
            onClick={() => {
              if (tagContextMenu?.tag) {
                startChatWithTag(tagContextMenu.tag);
                handleCloseTagContextMenu();
              }
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Start new chat with tag
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => confirmDeleteId && handleDeleteDocument(confirmDeleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};         