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

import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Bot, 
  Clock, 
  Zap, 
  Type, 
  Hash, 
  DollarSign, 
  Code, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { MessageDocType } from '../../db/types';
import { ThinkingSection } from '../ThinkingSection/ThinkingSection';
import { MarkdownRenderer } from '../MarkdownRenderer/MarkdownRenderer';

import { DocumentReferences, DocumentChunk } from '../DocumentReferences/DocumentReferences';
import { getLastReferences } from '../../client/langchainClient';
import { store } from '../../store/store';
import { useAppDispatch } from '../../store/store';
import { regenerateMessage } from '../../store/store';

interface MessageBubbleProps {
  message: MessageDocType;
  thinkingContent?: string;  // For live thinking content
  isThinking?: boolean;      // Flag for active thinking
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  thinkingContent,
  isThinking = false
}) => {
  const isUser = message.sender === 'user';
  const [isRegenerating, setIsRegenerating] = useState(false);
  const dispatch = useAppDispatch();
  const [metrics, setMetrics] = useState(message.metrics || {});
  const [hasMetrics, setHasMetrics] = useState(false);

  // React to changes in the message prop
  useEffect(() => {
    setMetrics(message.metrics || {});
    setHasMetrics(
      message.sender === 'assistant' &&
      !!(message.metrics?.processingTimeMs || 
         message.metrics?.tokensGenerated || 
         message.metrics?.wordsGenerated)
    );
  }, [message, message.metrics]);

  // Check if this is the last assistant message
  const isLastAssistantMessage = useMemo(() => {
    if (isUser) return false;

    const state = store.getState().chat;
    const messages = state.messages;

    // Find the last assistant message in the state
    const lastAssistantIndex = [...messages].reverse().findIndex(m => m.sender === 'assistant');
    if (lastAssistantIndex === -1) return false;

    // Convert to actual index
    const actualIndex = messages.length - 1 - lastAssistantIndex;

    // Compare with this message
    return messages[actualIndex]?.id === message.id;
  }, [isUser, message.id]);

  // Format timestamp
  const formattedDate = new Date(message.timestamp).toLocaleDateString();
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const [references, setReferences] = useState<DocumentChunk[]>(
    message.documentReferences?.map(ref => ({
      content: ref.content || "", // Use content if available
      documentName: ref.documentName,
      similarity: ref.similarity || 0.8,
      documentId: ref.documentId,
      chunkId: ref.chunkId,
      chunkIndex: ref.chunkIndex
    })) || []
  );

  const hasReferences = message.documentReferences && message.documentReferences.length > 0;

  // Only load from lastReferences for new messages without saved references
  useEffect(() => {
    if (message.sender === 'assistant' &&
      !message.documentReferences &&
      message.id === store.getState().chat.messages[store.getState().chat.messages.length - 1]?.id) {
      const refs = getLastReferences();
      if (refs && refs.length > 0) {
        // Convert references to DocumentChunk format with content preserved
        setReferences(refs.map(ref => ({
          documentId: ref.documentId,
          documentName: ref.documentName,
          chunkId: ref.chunkId,
          similarity: ref.similarity || 0.8,
          sourceType: ref.sourceType,
          chunkIndex: ref.chunkIndex,
          content: ref.content || ""
        })));
      } else {
        // Ensure references are empty if none are available
        setReferences([]);
      }
    }
  }, [message.id, message.documentReferences]);


  // Handle regenerate click
  const handleRegenerateClick = () => {
    // Set local UI state
    setIsRegenerating(true);

    // Dispatch regenerate action
    dispatch(regenerateMessage());

    // Reset regenerating state after a short delay to allow for transition
    setTimeout(() => {
      setIsRegenerating(false);
    }, 1000);
  };


  // Helper function to format model name for display
  const formatModelName = (modelId: string): string => {
    // Convert 'deepseek-r1:7b' to 'Deepseek 7B'
    if (!modelId) return 'Unknown';

    const parts = modelId.split(':');
    if (parts.length >= 2) {
      const provider = parts[0].split('-')[0]; // Get 'deepseek' from 'deepseek-r1'
      const size = parts[1].toUpperCase(); // Convert '7b' to '7B'
      return `${provider.charAt(0).toUpperCase() + provider.slice(1)} ${size}`;
    }
    return modelId;
  };

  return (
    <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6 gap-4 w-auto ml-auto relative justify-start`}>
      <Avatar className={`flex-shrink-0 mt-2 ${isUser ? 'bg-primary' : 'bg-secondary'}`}>
        <AvatarFallback>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-grow max-w-[80%] sm:max-w-[85%] md:max-w-[95%] ${isUser ? 'self-end text-right' : 'self-start text-left'}`}>
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-center mb-2`}>
          <h3 className={`text-sm font-semibold ${isUser ? 'order-2' : 'order-1'}`}>
            {isUser ? 'You' : 'Assistant'}
          </h3>
          <div className={`text-muted-foreground text-xs mx-2 ${isUser ? 'order-1' : 'order-2'}`}>
            <span>
              {formattedDate} {formattedTime}
            </span>
          </div>
        </div>

        {/* Show thinking section for assistant messages */}
        {!isUser && (message.thinkingContent || thinkingContent) && (
          <ThinkingSection
            content={thinkingContent || message.thinkingContent || ''}
            messageId={message.id}
            isStreaming={isThinking}
          />
        )}

        <div className={`${isUser ? 'bg-primary/10 text-primary-foreground p-4 rounded-lg shadow-sm' : 'bg-transparent text-foreground'}`}>
          {isUser ? (
            <p>{message.text}</p>
          ) : (
            <MarkdownRenderer content={message.text} />
          )}
        </div>

        {/* Show metrics for assistant messages */}
        {hasMetrics && (
          <>
            <Separator className="my-2 opacity-50" />
            <div className="flex flex-wrap gap-2 mt-2">
              {message.model && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none h-6 flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        {formatModelName(message.model)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI Model</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {metrics.processingTimeMs && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-muted border-none h-6 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {`${(metrics.processingTimeMs / 1000).toFixed(2)}s`}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Processing Time</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {metrics.tokensGenerated && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-muted border-none h-6 flex items-center gap-1">
                        <Type className="h-3 w-3" />
                        {`${metrics.tokensGenerated} tokens`}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tokens Generated</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {metrics.wordsGenerated && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-muted border-none h-6 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {`${metrics.wordsGenerated} words`}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Words Generated</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {metrics.tokensPerSecond && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-muted border-none h-6 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {`${metrics.tokensPerSecond.toFixed(1)} t/s`}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generation Speed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {metrics.tokensGenerated && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="bg-muted border-none h-6 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {`$${((metrics.tokensGenerated * 10) / 1000000).toFixed(6)}`}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cost at $10 per million tokens (gpt-4o pricing)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* {!isUser && (
                <Tooltip title={isPlaying ? "Stop Speech" : "Play as Speech"}>
                  <Chip
                    icon={isPlaying ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                    label={isPlaying ? "Stop" : "Speak"}
                    size="small"
                    variant="outlined"
                    onClick={handleSpeechClick}
                    sx={{
                      bgcolor: isPlaying ? 'primary.light' : 'action.hover',
                      border: 'none',
                      height: '24px',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isPlaying ? 'primary.main' : 'action.selected',
                      }
                    }}
                  />
                </Tooltip>
              )} */}

              {/* {!isUser && (
                <Tooltip title={isPlaying ? "Stop" : "Summarize and Speak"}>
                  <Chip
                    icon={
                      isSummarizing ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : isPlaying ? (
                        <VolumeUpIcon fontSize="small" />
                      ) : (
                        <AutoAwesomeIcon fontSize="small" />
                      )
                    }
                    label={isSummarizing ? "Summarizing..." : isPlaying ? "Stop" : "TLDR"}
                    size="small"
                    variant="outlined"
                    onClick={handleSummarizeClick}
                    disabled={isSummarizing}
                    sx={{
                      bgcolor: isPlaying ? 'secondary.light' : 'action.hover',
                      border: 'none',
                      height: '24px',
                      cursor: isSummarizing ? 'default' : 'pointer',
                      opacity: isSummarizing ? 0.7 : 1,
                      '&:hover': {
                        bgcolor: isSummarizing ? 'action.hover' : isPlaying ? 'secondary.main' : 'action.selected',
                      }
                    }}
                  />
                </Tooltip>
              )} */}
              {/* Add regenerate section for the last assistant message */}
            {!isUser && isLastAssistantMessage && (
              <div className="flex justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge 
                        variant="outline" 
                        className={`bg-muted border-none h-6 flex items-center gap-1 cursor-pointer hover:bg-muted/80 ${isRegenerating ? 'opacity-70 cursor-default' : ''}`}
                        onClick={handleRegenerateClick}
                      >
                        {isRegenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regenerate response</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            </div>
            
          </>
        )}

        {/* Show document references if available */}
        {(hasReferences || references.length > 0) && message.sender === 'assistant' && (
          <DocumentReferences references={references} />
        )}
      </div>
    </div>
  );
};
