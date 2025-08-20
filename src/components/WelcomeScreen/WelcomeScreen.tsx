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

import React from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { Card } from '../ui/card';
import { endOfStream, receiveToken, store, useAppDispatch, useAppSelector, setProcessing } from '../../store/store';
import { sendMessage, startSession } from '../../store/store';
import { callOpenAICompletion } from '../../client/openaiClient';
import { callRAGCompletion } from '../../client/langchainClient';
import { getDB } from '../../db/db';
import { abortControllerService } from '../../services/AbortControllerService';
import { MessageDocType, DocumentReference } from '../../db/types';
import { v4 as uuidv4 } from 'uuid';
import './WelcomeScreen.css';

// Define example queries
const EXAMPLE_QUERIES = [
  "Explain quantum computing in simple terms",
  "Write a poem about artificial intelligence",
  "How do I create a database schema for a blog?",
  "Suggest five creative team building activities",
  "Design a REST API for a social media app",
  "What are the principles of effective leadership?",
  "Generate a week-long itinerary for Rome",
  "Compare and contrast SQL and NoSQL databases"
];

export const WelcomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentSessionId, currentModel } = useAppSelector(state => state.chat);
  
  const handleQueryClick = async (query: string) => {
    // Create AbortController for this request
    const abortController = abortControllerService.createController();
    dispatch(setProcessing(true));
    
    // If no current session, create one instead of just returning with an error
    if (!currentSessionId) {
      console.warn("No active session found in WelcomeScreen, creating a new one");
      const newSessionId = uuidv4();
      dispatch(startSession(newSessionId));
      
      try {
        const db = await getDB();
        await db.sessions.insert({
          sessionId: newSessionId,
          createdAt: Date.now(),
          messages: [],
          lastUpdated: Date.now(),
          title: 'New Chat'
        });
        console.log("Created new session from WelcomeScreen:", newSessionId);
        
        // Continue with the message flow using the new session ID
        await processQueryWithSession(query, newSessionId, abortController.signal);
      } catch (error) {
        console.error("Failed to create new session from WelcomeScreen:", error);
        dispatch(setProcessing(false));
        abortControllerService.clear();
        return; // Can't proceed without a session
      }
    } else {
      // If session exists, process normally
      await processQueryWithSession(query, currentSessionId, abortController.signal);
    }
  };

  // Extract the query processing logic to a separate function
  const processQueryWithSession = async (query: string, sessionId: string, abortSignal: AbortSignal) => {
    // 1. Add to Redux
    dispatch(sendMessage(query));
    
    try {
      // 2. Save user message to RxDB
      const db = await getDB();
      const userMsgDoc: MessageDocType = {
        id: uuidv4(),
        text: query,
        sender: 'user',
        timestamp: Date.now(),
        documentReferences: []
      };
      
      await db.messages.insert(userMsgDoc);
      
      // 3. Update session with new message ID
      const sessionDoc = await db.sessions.findOne({
        selector: { sessionId: sessionId }
      }).exec();
      
      if (sessionDoc) {
        await sessionDoc.update({
          $set: { 
            messages: [...sessionDoc.messages, userMsgDoc.id],
            lastUpdated: Date.now()
          }
        });
        
        // 4. Prepare messages for API call
        const state = store.getState().chat;
        const selectedModel = currentModel || 'deepseek-r1:7b';
        const formattedMessages = state.messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));
        
        // 5. Check if we should use RAG (document references exist)
        const documentTags = sessionDoc.documentTags || [];
        const useRAG = documentTags.length > 0;
        
        if (useRAG) {
          console.log('Using RAG flow with document tags:', documentTags);
          // Call RAG completion
          await callRAGCompletion(
            query,
            formattedMessages,
            sessionId,
            selectedModel,
            (token) => {
              dispatch(receiveToken(token));
            },
            (documentReferences: DocumentReference[] = []) => {
              console.log('Welcome screen got document references:', 
                documentReferences.map(r => ({chunkId: r.chunkId, chunkIndex: r.chunkIndex})));
              dispatch(endOfStream(documentReferences));
            },
            abortSignal
          );
        } else {
          console.log('Using standard completion (no document references)');
          // Call standard completion
          await callOpenAICompletion(
            query,
            formattedMessages,
            selectedModel,
            (token) => {
              dispatch(receiveToken(token));
            },
            (documentReferences: DocumentReference[] = []) => {
              console.log('Welcome screen got document references:', 
                documentReferences.map(r => ({chunkId: r.chunkId, chunkIndex: r.chunkIndex})));
              dispatch(endOfStream(documentReferences));
            },
            abortSignal
          );
        }
      }
    } catch (error) {
      console.error('Error in welcome prompt:', error);
      dispatch(setProcessing(false));
      abortControllerService.clear();
    }
  };
  
  return (
    <div className="welcome-container max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="welcome-screen">
        <h1 className="welcome-main-title text-4xl font-bold text-center mb-8 flex items-center justify-center">
          <Sparkles className="text-primary mr-4 h-10 w-10" />
          Dell Pro AI Studio Chat
        </h1>
        
        <h2 className="welcome-subtitle text-2xl text-muted-foreground text-center mb-16">
          How can I help you today?
        </h2>
        
        <div className="example-queries-container grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXAMPLE_QUERIES.map((query, index) => (
            <Card 
              key={index}
              className="example-query cursor-pointer p-4 hover:bg-accent/50 transition-colors border-0 shadow-sm"
              onClick={() => handleQueryClick(query)}
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="query-icon h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <p className="text-sm leading-relaxed">
                  {query}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
