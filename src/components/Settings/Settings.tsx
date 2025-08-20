/**
 * Dell Pro AI Studio Chat
 * Copyright (c) 2024 Dell Inc., or its subsidiaries. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { ThemeConfig, DEFAULT_THEMES } from '../../theme/themeConfig';
import { DocumentUpload } from '../DocumentUpload/DocumentUpload';
import { ChevronDown, Info, Settings, FileText, Bot, Cloud, Database, Volume2 } from 'lucide-react';
import { DocumentLibrary } from '../DocumentLibrary/DocumentLibrary';
import { VectorDatabaseSettings } from './VectorDatabaseSettings';
import { vectorDbService } from '../../services/VectorDbService';
import { ModelService } from '../../services/ModelService';

// Custom color picker component
const ColorPickerInput: React.FC<{
  label: string;
  color: string;
  onChange: (color: string) => void;
}> = ({ label, color, onChange }) => {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-sm min-w-[100px]">{label}</span>
      <div className="flex items-center gap-1">
        <div 
          className="w-9 h-9 rounded border border-border"
          style={{ backgroundColor: color }}
        />
        <Input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-[120px]"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-0 border-none cursor-pointer"
        />
      </div>
    </div>
  );
};

// Settings component props
export interface AppSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: any;
  onSave: (settings: any) => void;
  onTestConnection?: () => void;
}

// Settings component
export const Settings: React.FC<AppSettingsProps> = ({
  open,
  onClose,
  settings,
  onSave,
  onTestConnection
}) => {
  // State for settings
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState('api');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);
  const [vectorDbCount, setVectorDbCount] = useState(0);
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null);

  // Initialize settings
  useEffect(() => {
    setLocalSettings({ ...settings });
    
    // Update vector database count
    const configs = vectorDbService.getConfigurations();
    setVectorDbCount(configs.length);
    
    // Reset preview theme when dialog opens
    setPreviewTheme(null);
  }, [open, settings]);

  // Handle settings change
  const handleChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle custom theme change
  const handleCustomThemeChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      customTheme: {
        ...prev.customTheme,
        [key]: value
      }
    }));
  };

  // Handle theme preview
  const handlePreviewTheme = (theme: ThemeConfig) => {
    setPreviewTheme(theme);
  };

  // Fetch available models
  const fetchModels = async (silent = false) => {
    if (!localSettings.apiBaseUrl || !localSettings.apiKey) {
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setTestStatus(null);
    }

    try {
      const modelService = new ModelService(
        localSettings.apiBaseUrl,
        localSettings.apiKey
      );
      
      const models = await modelService.getAvailableModels();
      setAvailableModels(models);
      
      if (!silent) {
        setTestStatus('success');
      }
      
      // Update enabled models if needed
      const updatedSettings = { ...localSettings };
      if (!updatedSettings.enabledModels || updatedSettings.enabledModels.length === 0) {
        updatedSettings.enabledModels = models.slice(0, 3); // Enable first 3 models by default
        setLocalSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      if (!silent) {
        setTestStatus('error');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // Handle test connection
  const handleTestConnection = () => {
    fetchModels();
  };

  // Handle save
  const handleSave = () => {
    const updatedSettings = { ...localSettings };
    
    // Ensure we have at least one enabled model
    if (!updatedSettings.enabledModels || updatedSettings.enabledModels.length === 0) {
      if (availableModels.length > 0) {
        updatedSettings.enabledModels = [availableModels[0]];
      } else {
        updatedSettings.enabledModels = ['gpt-3.5-turbo'];
      }
    }
    
    // Save settings
    onSave(updatedSettings);
    onClose();
  };

  // Render theme preview
  const renderThemePreview = (theme: ThemeConfig) => {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-4 bg-primary">
          <CardTitle className="text-primary-foreground text-lg">Theme Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="destructive">Destructive</Button>
            <Button size="sm" variant="outline">Outline</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
          </div>
          
          <div className="rounded border border-border p-4 bg-background">
            <p className="text-foreground">Sample text on background</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Handle vector database configuration changes
  const handleVectorDbConfigChange = () => {
    // Update the vector database count
    const configs = vectorDbService.getConfigurations();
    setVectorDbCount(configs.length);
  };

  // Add effect to load models when dialog opens or tab changes
  useEffect(() => {
    if (open && activeTab === 'api' && localSettings.apiBaseUrl && localSettings.apiKey) {
      fetchModels(true); // Silent fetch on load
    }
  }, [open, activeTab, localSettings.apiBaseUrl, localSettings.apiKey]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="assistant">Assistant</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="vectorDb" className="flex items-center gap-1">
                Vector Databases
                {vectorDbCount > 0 && <Cloud className="h-3 w-3" />}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="api" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">API Configuration</h3>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure your API settings here. The system uses two separate API endpoints: one for AI generation (LLM API) and one for document retrieval (Backend API).
                </AlertDescription>
              </Alert>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-base font-medium">LLM API Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    These settings control where chat messages and completions are sent for AI text generation.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="llm-url" className="text-sm font-medium">LLM API Base URL</label>
                      <Input
                        id="llm-url"
                        value={localSettings.apiBaseUrl}
                        onChange={(e) => handleChange('apiBaseUrl', e.target.value)}
                        placeholder="e.g., http://localhost:8553/v1/openai"
                      />
                      <p className="text-xs text-muted-foreground">
                        The URL for LLM text generation (e.g., http://localhost:8553/v1/openai for Dell Pro AI Studio)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="api-key" className="text-sm font-medium">API Key</label>
                      <Input
                        id="api-key"
                        type="password"
                        value={localSettings.apiKey}
                        onChange={(e) => handleChange('apiKey', e.target.value)}
                        placeholder="Enter API key"
                      />
                      <p className="text-xs text-muted-foreground">
                        API key for authentication (use 'dpais' for Dell Pro AI Studio)
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Backend API Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    These settings control document retrieval, embeddings, and other vector database operations.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="backend-url" className="text-sm font-medium">Backend API URL</label>
                      <Input
                        id="backend-url"
                        value={localSettings.backendUrl}
                        onChange={(e) => handleChange('backendUrl', e.target.value)}
                        placeholder="e.g., http://localhost:8000"
                      />
                      <p className="text-xs text-muted-foreground">
                        The URL for the backend API (e.g., http://localhost:8000 for local development)
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="streaming"
                        checked={localSettings.streamingEnabled}
                        onCheckedChange={(checked) => handleChange('streamingEnabled', checked)}
                      />
                      <label htmlFor="streaming" className="text-sm font-medium">
                        Enable streaming responses
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Available Models</h4>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleTestConnection} 
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      {isLoading ? 'Testing...' : 'Test Connection'}
                    </Button>
                    
                    {testStatus === 'success' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Connection successful
                      </Badge>
                    )}
                    
                    {testStatus === 'error' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Connection failed
                      </Badge>
                    )}
                  </div>
                  
                  {availableModels.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Enable models for chat:</p>
                      <div className="space-y-2">
                        {availableModels.map((model) => (
                          <div key={model} className="flex items-center space-x-2">
                            <Switch
                              id={`model-${model}`}
                              checked={localSettings.enabledModels?.includes(model) || false}
                              onCheckedChange={(checked) => {
                                const newEnabledModels = checked
                                  ? [...(localSettings.enabledModels || []), model]
                                  : (localSettings.enabledModels || []).filter((m: string) => m !== model);
                                handleChange('enabledModels', newEnabledModels);
                              }}
                            />
                            <label htmlFor={`model-${model}`} className="text-sm">
                              {model}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Appearance Settings</h3>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Theme</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(DEFAULT_THEMES).map(([key, theme]) => (
                      <Card 
                        key={key}
                        className={`overflow-hidden cursor-pointer border-2 ${
                          localSettings.theme === key ? 'border-primary' : 'border-border'
                        }`}
                        onClick={() => {
                          handleChange('theme', key);
                          handlePreviewTheme(theme);
                        }}
                      >
                        <CardHeader className="p-3 bg-primary">
                          <CardTitle className="text-primary-foreground text-sm">{theme.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                          <div 
                            className="h-6 w-full rounded"
                            style={{ backgroundColor: theme.primary }}
                          ></div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Card 
                      className={`overflow-hidden cursor-pointer border-2 ${
                        localSettings.theme === 'custom' ? 'border-primary' : 'border-border'
                      }`}
                      onClick={() => {
                        handleChange('theme', 'custom');
                        handlePreviewTheme(localSettings.customTheme);
                      }}
                    >
                      <CardHeader className="p-3 bg-primary">
                        <CardTitle className="text-primary-foreground text-sm">Custom Theme</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div 
                          className="h-6 w-full rounded"
                          style={{ backgroundColor: localSettings.customTheme?.primary }}
                        ></div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {localSettings.theme === 'custom' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-medium">Custom Theme Colors</h4>
                    <div className="space-y-2">
                      <ColorPickerInput
                        label="Primary"
                        color={localSettings.customTheme?.primary || '#007db8'}
                        onChange={(color) => handleCustomThemeChange('primary', color)}
                      />
                      <ColorPickerInput
                        label="Secondary"
                        color={localSettings.customTheme?.secondary || '#444444'}
                        onChange={(color) => handleCustomThemeChange('secondary', color)}
                      />
                      <ColorPickerInput
                        label="Background"
                        color={localSettings.customTheme?.background || '#ffffff'}
                        onChange={(color) => handleCustomThemeChange('background', color)}
                      />
                      <ColorPickerInput
                        label="Text"
                        color={localSettings.customTheme?.text || '#333333'}
                        onChange={(color) => handleCustomThemeChange('text', color)}
                      />
                    </div>
                  </div>
                )}
                
                {previewTheme && (
                  <div className="space-y-2">
                    <h4 className="text-base font-medium">Preview</h4>
                    {renderThemePreview(previewTheme)}
                  </div>
                )}
                
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Font Size</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Small</span>
                      <Slider
                        value={[localSettings.fontSize || 16]}
                        min={12}
                        max={20}
                        step={1}
                        onValueChange={(value) => handleChange('fontSize', value[0])}
                        className="w-64"
                      />
                      <span className="text-sm">Large</span>
                    </div>
                    <p className="text-sm" style={{ fontSize: `${localSettings.fontSize || 16}px` }}>
                      Sample text at {localSettings.fontSize || 16}px
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="assistant" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Assistant Settings</h3>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Chat Behavior</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-scroll"
                        checked={localSettings.autoScroll !== false}
                        onCheckedChange={(checked) => handleChange('autoScroll', checked)}
                      />
                      <label htmlFor="auto-scroll" className="text-sm font-medium">
                        Auto-scroll to new messages
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-title"
                        checked={localSettings.autoTitle !== false}
                        onCheckedChange={(checked) => handleChange('autoTitle', checked)}
                      />
                      <label htmlFor="auto-title" className="text-sm font-medium">
                        Auto-generate chat titles
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="text-to-speech"
                        checked={localSettings.textToSpeech === true}
                        onCheckedChange={(checked) => handleChange('textToSpeech', checked)}
                      />
                      <label htmlFor="text-to-speech" className="text-sm font-medium">
                        Enable text-to-speech for assistant responses
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-base font-medium">System Prompt</h4>
                  <p className="text-sm text-muted-foreground">
                    Customize the system prompt that defines the assistant's behavior.
                  </p>
                  
                  <Textarea
                    value={localSettings.systemPrompt || ''}
                    onChange={(e) => handleChange('systemPrompt', e.target.value)}
                    placeholder="You are a helpful assistant..."
                    className="min-h-[150px]"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChange('systemPrompt', 'You are a helpful assistant that provides accurate, concise information. If you don\'t know something, admit it rather than making up an answer.')}
                  >
                    Reset to Default
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Model Parameters</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label htmlFor="temperature" className="text-sm font-medium">Temperature: {localSettings.temperature || 0.7}</label>
                      </div>
                      <Slider
                        id="temperature"
                        value={[localSettings.temperature || 0.7]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={(value) => handleChange('temperature', value[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower values make responses more deterministic, higher values more creative.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label htmlFor="max-tokens" className="text-sm font-medium">Max Tokens: {localSettings.maxTokens || 2000}</label>
                      </div>
                      <Slider
                        id="max-tokens"
                        value={[localSettings.maxTokens || 2000]}
                        min={100}
                        max={4000}
                        step={100}
                        onValueChange={(value) => handleChange('maxTokens', value[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum number of tokens in the response.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Document Settings</h3>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Document Upload</h4>
                  <DocumentUpload />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Document Library</h4>
                  <DocumentLibrary height={300} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vectorDb" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Vector Database Settings</h3>
              <VectorDatabaseSettings onConfigurationChange={handleVectorDbConfigChange} />
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="border-t border-border pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
