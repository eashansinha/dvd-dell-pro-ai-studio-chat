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
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import ReactMarkdown from 'react-markdown';
import { useAppSelector } from '../../store/store';

interface ThinkingSectionProps {
  content: string;
  messageId?: string; // Optional, for saved messages
  isStreaming?: boolean; // Flag for active thinking
}

export const ThinkingSection: React.FC<ThinkingSectionProps> = ({ 
  content, 
  messageId,
  isStreaming = false
}) => {
  // Get display state from Redux store
  const displayThinking = useAppSelector(state => state.chat.displayThinking);
  
  // Local expanded state - default to true or get from Redux store if messageId exists
  const [expanded, setExpanded] = useState(
    messageId ? (displayThinking[messageId] !== false) : true
  );
  
  // Keep local state in sync with Redux store when display settings change
  useEffect(() => {
    if (messageId && displayThinking[messageId] !== undefined) {
      setExpanded(displayThinking[messageId]);
    }
  }, [messageId, displayThinking]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };
  
  return (
    <Card className="p-3 my-2 mx-0 bg-card border-l-4 border-l-secondary rounded-md">
      <div 
        className="flex items-center mb-2 cursor-pointer p-1 rounded hover:bg-secondary/10 transition-colors"
        onClick={handleToggle}
      >
        <Brain className="text-secondary mr-2 h-4 w-4" />
        <h4 className="text-secondary font-semibold text-sm">
          {isStreaming ? "Thinking..." : "Thinking Process"}
        </h4>
        <div className="flex-grow" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-secondary hover:bg-secondary/10"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>
      
      {expanded && (
        <div className="whitespace-pre-wrap font-mono text-sm max-h-[300px] overflow-y-auto bg-background p-3 rounded border border-border">
          <ReactMarkdown>{content || 'Processing your request...'}</ReactMarkdown>
        </div>
      )}
    </Card>
  );
};
