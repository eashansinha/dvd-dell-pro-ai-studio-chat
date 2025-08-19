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
  Box,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Switch,
  Tooltip,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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
  const [aiProvider, setAiProvider] = useState<string>(settings.aiProvider || 'dell-pro-ai-studio');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>(settings.ollamaBaseUrl || 'http://localhost:11434');
  
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
      streamingEnabled,
      aiProvider,
      ollamaBaseUrl
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
  
  const handleStreamingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStreamingEnabled(e.target.checked);
  };

  const handleProviderChange = (e: SelectChangeEvent<string>) => {
    setAiProvider(e.target.value);
  };

  const handleOllamaBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOllamaBaseUrl(e.target.value);
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        API Settings
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        Configure your AI provider and API settings here. The system supports Dell Pro AI Studio and Ollama for local model access.
      </Alert>
      
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth margin="normal">
          <InputLabel>AI Provider</InputLabel>
          <Select
            value={aiProvider}
            onChange={handleProviderChange}
            label="AI Provider"
          >
            <MenuItem value="dell-pro-ai-studio">Dell Pro AI Studio</MenuItem>
            <MenuItem value="ollama">Ollama (Local)</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {aiProvider === 'ollama' ? (
        <>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Ollama Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Configure connection to your local Ollama instance.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Ollama Base URL"
              value={ollamaBaseUrl}
              onChange={handleOllamaBaseUrlChange}
              margin="normal"
              placeholder="http://localhost:11434"
              helperText="The base URL for your Ollama instance"
            />
          </Box>
        </>
      ) : (
        <>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Dell Pro AI Studio Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Configure connection to Dell Pro AI Studio for enterprise AI models.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="LLM API Base URL"
              value={apiBaseUrl}
              onChange={handleApiBaseUrlChange}
              margin="normal"
              placeholder="http://localhost:8553/v1/openai"
              helperText="The base URL for Dell Pro AI Studio LLM API"
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="API Key"
              value={apiKey}
              onChange={handleApiKeyChange}
              margin="normal"
              type={showApiKey ? 'text' : 'password'}
              placeholder="dpais"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle api key visibility"
                      onClick={handleToggleApiKeyVisibility}
                      edge="end"
                    >
                      {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="API key for Dell Pro AI Studio authentication"
            />
          </Box>
        </>
      )}
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Model ID"
          value={modelId}
          onChange={handleModelIdChange}
          margin="normal"
          placeholder="Example: llama3"
          helperText="The model identifier to use for chat completions"
        />
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Backend API Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        These settings control document retrieval, embeddings, and other vector database operations.
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Backend API URL"
          value={backendApiUrl}
          onChange={handleBackendApiUrlChange}
          margin="normal"
          placeholder="Example: http://localhost:8000"
          helperText="URL for the document retrieval backend API"
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Embeddings Model"
          value={embeddingsModel}
          onChange={handleEmbeddingsModelChange}
          margin="normal"
          placeholder="Example: nomic-embed-text"
          helperText={
            <span>
              Model to use for embeddings 
              <Tooltip title="nomic-embed-text, mxbai-embed-large" arrow>
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </span>
          }
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={streamingEnabled}
              onChange={handleStreamingChange}
              name="streaming"
              color="primary"
            />
          }
          label="Enable streaming responses"
        />
        <Typography variant="caption" color="textSecondary" display="block">
          When enabled, responses will appear word by word as they are generated
        </Typography>
      </Box>
    </Box>
  );
};

export default APISettings;    