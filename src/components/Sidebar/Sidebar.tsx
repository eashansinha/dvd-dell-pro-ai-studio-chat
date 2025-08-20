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
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Settings, MessageCircle, FileText, NotebookPen, Cloud } from 'lucide-react';
import { ChatHistoryItem } from '../ChatHistoryItem/ChatHistoryItem';
import { DocumentLibrary } from '../DocumentLibrary/DocumentLibrary';
import { CompanyDocuments } from '../CompanyDocuments/CompanyDocuments';
import { useAppSelector, useAppDispatch, startSession, deleteSession } from '../../store/store';
import { getDB } from '../../db/db';
import type { SessionDocType } from '../../db/types';
import { v4 as uuidv4 } from 'uuid';
import { vectorDbService } from '../../services/VectorDbService';
import { VectorDbConfig } from '../../types/vectorDb';
import { useSettings } from '../../context/SettingsContext';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const dispatch = useAppDispatch();
  const currentSessionId = useAppSelector(state => state.chat.currentSessionId);
  const messages = useAppSelector(state => state.chat.messages);
  const [loadedSessions, setLoadedSessions] = useState<SessionDocType[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'documents' | 'company'>('chats');
  const [documentCount, setDocumentCount] = useState(0);
  const [companyDbCount, setCompanyDbCount] = useState(0);
  const [activeVectorDbs, setActiveVectorDbs] = useState<VectorDbConfig[]>([]);
  const { settings } = useSettings();
  
  // Check if current session is empty (has no messages)
  const isCurrentSessionEmpty = messages.length === 0;

  // Reset activeTab if company tab is disabled
  useEffect(() => {
    if (activeTab === 'company' && !settings.companyDocumentsEnabled) {
      setActiveTab('chats');
    }
  }, [settings.companyDocumentsEnabled, activeTab]);

  // Load sessions from database
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const db = await getDB();
        // Subscribe to sessions collection for real-time updates
        const subscription = db.sessions.find()
          .sort({ lastUpdated: 'desc' })
          .$.subscribe((sessions) => {
            // Convert RxDB documents to plain objects to avoid readonly issues
            const sessionDocs = sessions.map(doc => ({
              sessionId: doc.sessionId,
              createdAt: doc.createdAt,
              lastUpdated: doc.lastUpdated,
              title: doc.title,
              messages: [...doc.messages],
              documentTags: doc.documentTags || []
            }));
            setLoadedSessions(sessionDocs);
          });
        
        // Count documents
        const documents = await db.documents.find().exec();
        setDocumentCount(documents.length);
        
        // Subscribe to document changes
        const docSubscription = db.documents.find().$.subscribe(docs => {
          setDocumentCount(docs.length);
        });
        
        // Count company vector databases
        const companyDbConfigs = vectorDbService.getConfigurations();
        setCompanyDbCount(companyDbConfigs.filter(config => config.enabled).length);
        
        return () => {
          subscription.unsubscribe();
          docSubscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };
    
    loadSessions();
  }, []);
  
  // Load active vector databases when current session changes
  useEffect(() => {
    if (currentSessionId) {
      loadActiveVectorDbs(currentSessionId);
    } else {
      setActiveVectorDbs([]);
    }
  }, [currentSessionId]);
  
  // Load active vector DBs for the current session
  const loadActiveVectorDbs = async (sessionId: string) => {
    try {
      const db = await getDB();
      const session = await db.sessions.findOne({
        selector: { sessionId }
      }).exec();
      
      if (session) {
        const tags = session.documentTags || [];
        const vdbIds: string[] = [];
        
        // Extract vector DB IDs from tags
        tags.forEach(tag => {
          if (tag.startsWith('vdb:')) {
            const parts = tag.substring(4).split(':');
            vdbIds.push(parts[0]); // Get the DB ID
          }
        });
        
        // Get configurations for these IDs
        const allConfigs = vectorDbService.getConfigurations();
        const activeConfigs = allConfigs.filter(config => vdbIds.includes(config.id));
        
        setActiveVectorDbs(activeConfigs);
      }
    } catch (error) {
      console.error('Error loading active vector DBs:', error);
    }
  };

  // Create a new chat session
  const handleNewChat = async () => {
    try {
      const newSessionId = uuidv4();
      
      // First update Redux
      dispatch(startSession(newSessionId));
      
      // Then add to RxDB
      const db = await getDB();
      await db.sessions.insert({
        sessionId: newSessionId,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        title: 'New Chat',
        messages: [],
        documentTags: [] // Added for document references
      });
      
      console.log('Created new chat session:', newSessionId);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  // Delete a chat session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Update Redux state first
      dispatch(deleteSession(sessionId));
      
      // The actual deletion in the database happens in the middleware
      console.log('Deleting session:', sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col w-[350px] h-full bg-background border-r border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex-grow">
              Dell Pro AI Studio Chat
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleNewChat} 
                  variant="ghost"
                  size="icon"
                  disabled={isCurrentSessionEmpty}
                >
                  <NotebookPen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isCurrentSessionEmpty ? "Enter a message first" : "New Chat"}
              </TooltipContent>
            </Tooltip>
          </div>
        
        {/* Active Vector Databases Chips */}
        {activeVectorDbs.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeVectorDbs.map(vdb => (
              <Tooltip key={vdb.id}>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Cloud className="h-3 w-3" />
                    {vdb.name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {vdb.description || vdb.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chats' | 'documents' | 'company')} className="mb-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2 relative">
              <FileText className="h-4 w-4" />
              Documents
              {documentCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {documentCount}
                </Badge>
              )}
            </TabsTrigger>
            {settings.companyDocumentsEnabled && (
              <TabsTrigger value="company" className="flex items-center gap-2 relative">
                <Cloud className="h-4 w-4" />
                Company
                {companyDbCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {companyDbCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <TabsContent value="chats" className="mt-0">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Chat History
          </h3>
          <div className="space-y-1">
            {loadedSessions.map((session) => (
              <ChatHistoryItem 
                key={session.sessionId} 
                session={session} 
                isActive={session.sessionId === currentSessionId} 
                onDelete={handleDeleteSession}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-0">
          <DocumentLibrary />
        </TabsContent>
        
        {settings.companyDocumentsEnabled && (
          <TabsContent value="company" className="mt-0">
            <CompanyDocuments />
          </TabsContent>
        )}
      </div>
      
      {/* Settings button at bottom */}
      <div className="p-4 border-t border-border flex justify-start">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onOpenSettings} variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Settings
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
    </TooltipProvider>
  );
};
