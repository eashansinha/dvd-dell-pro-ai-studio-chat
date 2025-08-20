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
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Switch } from '../ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { useSettings } from '../../context/SettingsContext';

const APISettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  
  const [apiKey, setApiKey] = useState<string>(settings.apiKey || '');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(settings.apiBaseUrl || 'http://localhost:8553/v1');
  const [backendApiUrl, setBackendApiUrl] = useState<string>(settings.backendApiUrl || 'http://localhost:8000');
  const [modelId, setModelId] = useState<string>(settings.modelId || 'llama3');
  const [embeddingsModel, setEmbeddingsModel] = useState<string>(settings.embeddingsModel || 'nomic-embed-text');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [streamingEnabled, setStreamingEnabled] = useState<boolean>(settings.streamingEnabled !== false);
  
  useEffect(() => {
    // Save settings when component unmounts
    return () => {
      saveSettings();
    };
  }, []);
  
  const saveSettings = () => {
    updateSettings({
      apiKey,
      apiBaseUrl,
      backendApiUrl,
      modelId,
      embeddingsModel,
      streamingEnabled
    });
  };
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };
  
  const handleApiBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiBaseUrl(e.target.value);
  };
  
  const handleBackendApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackendApiUrl(e.target.value);
  };
  
  const handleModelIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModelId(e.target.value);
  };
  
  const handleEmbeddingsModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmbeddingsModel(e.target.value);
  };
  
  const handleToggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };
  
  
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold">
          API Settings
        </h2>
        
        <Alert>
          <AlertDescription>
            Configure your API settings here. The system uses two separate API endpoints: one for AI generation (LLM API) and one for document retrieval (Backend API).
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            LLM API Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            These settings control where chat messages and completions are sent for AI text generation.
          </p>
          
          <div className="space-y-2">
            <label htmlFor="api-base-url" className="text-sm font-medium">
              LLM API Base URL
            </label>
            <Input
              id="api-base-url"
              value={apiBaseUrl}
              onChange={handleApiBaseUrlChange}
              placeholder="Example: http://localhost:8553/v1/openai"
            />
            <p className="text-xs text-muted-foreground">
              The base URL for LLM text generation (Dell Pro AI Studio, etc.)
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              API Key
            </label>
            <div className="relative">
              <Input
                id="api-key"
                value={apiKey}
                onChange={handleApiKeyChange}
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter API key (default: empty for Dell Pro AI Studio)"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={handleToggleApiKeyVisibility}
                aria-label="toggle api key visibility"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              API key for authentication (leave empty for local Dell Pro AI Studio)
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="model-id" className="text-sm font-medium">
              Model ID
            </label>
            <Input
              id="model-id"
              value={modelId}
              onChange={handleModelIdChange}
              placeholder="Example: llama3"
            />
            <p className="text-xs text-muted-foreground">
              The model identifier to use for chat completions
            </p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            Backend API Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            These settings control document retrieval, embeddings, and other vector database operations.
          </p>
          
          <div className="space-y-2">
            <label htmlFor="backend-api-url" className="text-sm font-medium">
              Backend API URL
            </label>
            <Input
              id="backend-api-url"
              value={backendApiUrl}
              onChange={handleBackendApiUrlChange}
              placeholder="Example: http://localhost:8000"
            />
            <p className="text-xs text-muted-foreground">
              URL for the document retrieval backend API
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="embeddings-model" className="text-sm font-medium">
              Embeddings Model
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="embeddings-model"
                value={embeddingsModel}
                onChange={handleEmbeddingsModelChange}
                placeholder="Example: nomic-embed-text"
                className="flex-1"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>nomic-embed-text, mxbai-embed-large</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              Model to use for embeddings
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="streaming"
                checked={streamingEnabled}
                onCheckedChange={setStreamingEnabled}
              />
              <label htmlFor="streaming" className="text-sm font-medium">
                Enable streaming responses
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, responses will appear word by word as they are generated
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default APISettings;    