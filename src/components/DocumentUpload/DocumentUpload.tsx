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
  CloudUpload, 
  Trash2, 
  Search, 
  Loader2 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { List, ListItem, ListItemText } from '../ui/list';
import { DocumentManager } from '../../services/DocumentManager';
import { DocumentDocType, DocumentChunkDocType } from '../../db/types';
import { getDB } from '../../db/db';
import './DocumentUpload.css';

// Define interfaces for different document types in search results
interface DocumentSearchResult {
  document: DocumentDocType;
  similarity: number;
}

interface ChunkSearchResult {
  document: DocumentChunkDocType;
  similarity: number;
}

// Use a type that can be either document or chunk search results
type SearchResult = DocumentSearchResult | ChunkSearchResult;

interface EmbeddingProgress {
  processedChunks: number;
  totalChunks: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  chunkProcessingRate: number;
  currentFile?: string;
  fileIndex?: number;
  totalFiles?: number;
}

export const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [documents, setDocuments] = useState<DocumentDocType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewDocument, setViewDocument] = useState<DocumentDocType | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // New state for tracking embedding progress
  const [embeddingProgress, setEmbeddingProgress] = useState<EmbeddingProgress | null>(null);
  
  // Format time helper function
  const formatTime = (milliseconds: number): string => {
    if (!milliseconds || milliseconds <= 0) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Function to determine if a search result is a document or a chunk
  const isDocumentResult = (result: SearchResult): result is DocumentSearchResult => {
    return 'uploadDate' in result.document.metadata;
  };

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const docs = await db.documents.find().exec();
      setDocuments(docs.map(doc => doc.toJSON() as DocumentDocType));
      
      // Load all tags
      const allTags = await DocumentManager.getAllTags();
      setTags(allTags);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setEmbeddingProgress(null);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress with file information
        setEmbeddingProgress({
          processedChunks: 0,
          totalChunks: 0,
          elapsedTime: 0,
          estimatedTimeRemaining: 0,
          chunkProcessingRate: 0,
          currentFile: file.name,
          fileIndex: i,
          totalFiles: files.length
        });
        
        // Process document with progress tracking
        await DocumentManager.uploadDocument(
          file, 
          tags, 
          (progress) => {
            setEmbeddingProgress({
              ...progress,
              currentFile: file.name,
              fileIndex: i,
              totalFiles: files.length
            });
          }
        );
      }
      
      // Reset form
      setFiles([]);
      setTags([]);
      setEmbeddingProgress(null);
      
      // Reload documents
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    setSearching(true);
    try {
      const results = await DocumentManager.searchDocuments(searchQuery);
      setSearchResults(results as SearchResult[]);
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await DocumentManager.deleteDocument(id);
      await loadDocuments();
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatSearchResultSecondary = (result: SearchResult): string => {
    if (isDocumentResult(result)) {
      return `Similarity: ${(result.similarity * 100).toFixed(1)}% • ${formatSize(result.document.metadata.size)} • ${formatDate(result.document.metadata.uploadDate)}`;
    } else {
      return `Similarity: ${(result.similarity * 100).toFixed(1)}% • Chunk ${result.document.chunkIndex + 1}`;
    }
  };

  return (
    <div className="document-upload-container space-y-6">
      <h1 className="text-2xl font-bold">
        Document Library
      </h1>

      <Card className="upload-section">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="file-input-container">
            <Button
              variant="outline"
              className="upload-button"
              asChild
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <CloudUpload className="h-4 w-4" />
                Select Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleFileChange}
                />
              </label>
            </Button>
            
            {files.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {files.length} file(s) selected
              </p>
            )}
          </div>
          
          <div className="tags-section space-y-3">
            <h3 className="text-sm font-medium">
              Add Tags
            </h3>
            
            <div className="tag-input flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag"
                className="flex-1"
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
            
            <div className="tags-list flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="tag-chip cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Embedding Progress Section */}
          {embeddingProgress && (
            <div className="embedding-progress-container space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="progress-header flex justify-between items-center">
                <p className="text-sm">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
                  Processing {embeddingProgress.currentFile}
                  {embeddingProgress.totalFiles && embeddingProgress.totalFiles > 1 && 
                    ` (${embeddingProgress.fileIndex! + 1}/${embeddingProgress.totalFiles})`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {embeddingProgress.processedChunks}/{embeddingProgress.totalChunks} chunks
                </p>
              </div>
              
              <Progress 
                value={embeddingProgress.totalChunks > 0 
                  ? (embeddingProgress.processedChunks / embeddingProgress.totalChunks) * 100 
                  : 0} 
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
          
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="submit-button w-full"
          >
            {uploading && !embeddingProgress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploading ? 'Embedding Documents...' : 'Add Documents'}
          </Button>
        </CardContent>
      </Card>

      <Card className="search-section">
        <CardHeader>
          <CardTitle>Search Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="search-input-container flex gap-2">
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery || searching}
              className="flex items-center gap-2"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3 className="text-sm font-medium mb-3">
                Search Results
              </h3>
              
              <List>
                {searchResults.map((result, index) => {
                  const isDoc = isDocumentResult(result);
                  const displayName = isDoc 
                    ? result.document.metadata.filename 
                    : `${result.document.metadata.documentName} (Chunk ${result.document.chunkIndex + 1})`;
                    
                  return (
                    <ListItem
                      key={index}
                      className="cursor-pointer hover:bg-muted/50 rounded-md"
                      onClick={() => {
                        if (isDoc) {
                          setViewDocument(result.document);
                        } else {
                          console.log("Viewing chunk:", result.document);
                        }
                      }}
                    >
                      <ListItemText
                        primary={displayName}
                        secondary={formatSearchResultSecondary(result)}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="documents-section">
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="loading-container flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          ) : (
            <List>
              {documents.map(doc => (
                <ListItem
                  key={doc.id}
                  className="cursor-pointer hover:bg-muted/50 rounded-md flex justify-between items-start"
                  onClick={() => setViewDocument(doc)}
                >
                  <div className="flex-1">
                    <ListItemText
                      primary={doc.metadata.filename}
                      secondary={
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(doc.metadata.uploadDate)} • {formatSize(doc.metadata.size)}
                          </span>
                          <div className="document-tags flex flex-wrap gap-1">
                            {doc.metadata.tags.map(tag => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="tag-chip-small text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(doc.id);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog
        open={viewDocument !== null}
        onOpenChange={(open) => !open && setViewDocument(null)}
      >
        {viewDocument && (
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{viewDocument.metadata.filename}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {formatDate(viewDocument.metadata.uploadDate)} • {formatSize(viewDocument.metadata.size)}
              </p>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto space-y-4">
              <div className="document-tags-header flex flex-wrap gap-2">
                {viewDocument.metadata.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="tag-chip"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <Card className="document-content">
                <CardContent className="p-4">
                  <pre className="whitespace-pre-wrap text-sm">{viewDocument.content}</pre>
                </CardContent>
              </Card>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setViewDocument(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this document? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
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