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

import { getSettings, saveSettings } from '../utils/settings';
import { ProviderService, AIProvider } from './ProviderService';

interface Model {
  id: string;
  tag: string | null;
  capability: string | null;
  isTextToTextModel: boolean;
  baseName: string;
}

interface FetchModelsResult {
  success: boolean;
  message: string;
  models?: string[];
  modelTags?: Record<string, string>;
  modelCapabilities?: Record<string, string>;
  updatedEnabledModels?: Record<string, boolean>;
}

export class ModelService {
  static async fetchModels(provider: AIProvider, _silent = false): Promise<FetchModelsResult> {
    const config = ProviderService.getProviderConfig(provider);
    
    if (!config.baseUrl || (config.requiresAuth && !config.apiKey)) {
      return {
        success: false,
        message: 'API URL and key are required'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      let models: string[] = [];
      
      if (provider === 'ollama') {
        models = await ProviderService.fetchOllamaModels(config.baseUrl);
        clearTimeout(timeoutId);
      } else {
        const response = await fetch(`${config.baseUrl}${config.modelsEndpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched models:', data);
        
        const mappedModels = data.data.map((model: any) => {
          let tag = null;
          const id = model.id;
          
          if (id.startsWith('public-cloud/')) {
            tag = 'public-cloud';
          } else if (id.startsWith('private-cloud/')) {
            tag = 'private-cloud';
          } else if (id.startsWith('GPU/')) {
            tag = 'GPU';
          } else if (id.startsWith('NPU/')) {
            tag = 'NPU';
          } else if (id.startsWith('dNPU/')) {
            tag = 'dNPU';
          } else {
            tag = 'CPU';
          }
          
          const isTextToTextModel = model.capability === 'TextToText' || model.capability === 'TextToTextWithTools';
          
          let baseName = id;
          const prefixes = ['public-cloud/', 'private-cloud/', 'GPU/', 'NPU/', 'CPU/', 'dNPU/'];
          for (const prefix of prefixes) {
            if (baseName.startsWith(prefix)) {
              baseName = baseName.substring(prefix.length);
              break;
            }
          }
          
          return {
            id: id,
            tag: tag,
            capability: model.capability || null,
            isTextToTextModel: isTextToTextModel,
            baseName: baseName
          };
        });
        
        const modelMap = new Map<string, Model>();
        mappedModels.forEach((model: Model) => {
          const existing = modelMap.get(model.id);
          if (!existing) {
            modelMap.set(model.id, model);
          } else {
            if (model.capability === 'TextToTextWithTools' && existing.capability === 'TextToText') {
              modelMap.set(model.id, model);
            }
          }
        });
        
        const modelArray = Array.from(modelMap.values());
        models = modelArray.map(model => model.id);
      }
      
      const modelTags: Record<string, string> = {};
      const modelCapabilities: Record<string, string> = {};
      const updatedEnabledModels: Record<string, boolean> = {};
      
      if (provider === 'ollama') {
        models.forEach(modelId => {
          modelTags[modelId] = 'local';
          modelCapabilities[modelId] = 'TextToText';
          updatedEnabledModels[modelId] = true;
        });
      } else {
        const response = await fetch(`${config.baseUrl}${config.modelsEndpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        const mappedModels = data.data.map((model: any) => {
          let tag = null;
          const id = model.id;
          
          if (id.startsWith('public-cloud/')) {
            tag = 'public-cloud';
          } else if (id.startsWith('private-cloud/')) {
            tag = 'private-cloud';
          } else if (id.startsWith('GPU/')) {
            tag = 'GPU';
          } else if (id.startsWith('NPU/')) {
            tag = 'NPU';
          } else if (id.startsWith('dNPU/')) {
            tag = 'dNPU';
          } else {
            tag = 'CPU';
          }
          
          const isTextToTextModel = model.capability === 'TextToText' || model.capability === 'TextToTextWithTools';
          
          return {
            id: id,
            tag: tag,
            capability: model.capability || null,
            isTextToTextModel: isTextToTextModel
          };
        });
        
        mappedModels.forEach((model: any) => {
          if (model.tag) {
            modelTags[model.id] = model.tag;
          }
          if (model.capability) {
            modelCapabilities[model.id] = model.capability;
          }
          if (model.isTextToTextModel) {
            updatedEnabledModels[model.id] = true;
          } else {
            updatedEnabledModels[model.id] = false;
          }
        });
      }
      
      return {
        success: true,
        message: `Connection successful! Found ${models.length} models.`,
        models,
        modelTags,
        modelCapabilities,
        updatedEnabledModels
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout - Service may be starting up or offline'
        };
      }
      
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Initialize models on app startup with retry logic
   */
  static async initializeModels(): Promise<void> {
    const savedSettings = getSettings();
    const provider = savedSettings.aiProvider || 'dell-pro-ai-studio';
    
    const hasValidConfig = provider === 'ollama' 
      ? savedSettings.ollamaBaseUrl
      : savedSettings.apiBaseUrl && savedSettings.apiKey;
      
    if (hasValidConfig && (!savedSettings.availableModels || savedSettings.availableModels.length === 0)) {
      console.log(`Fetching models for provider: ${provider}`);
      
      let result: FetchModelsResult | null = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && (!result || !result.success)) {
        result = await this.fetchModels(provider, true);
        
        if (!result.success && retryCount < maxRetries - 1) {
          console.log(`Model fetch attempt ${retryCount + 1} failed, retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
        } else {
          break;
        }
      }
      
      if (result && result.success && result.models) {
        const updatedSettings = {
          ...savedSettings,
          availableModels: result.models,
          modelTags: result.modelTags || {},
          modelCapabilities: result.modelCapabilities || {},
          enabledModels: result.updatedEnabledModels || {}
        };
        
        if (!updatedSettings.defaultModel) {
          const firstEnabledModel = result.models.find(modelId => 
            result.updatedEnabledModels?.[modelId] === true
          );
          if (firstEnabledModel) {
            updatedSettings.defaultModel = firstEnabledModel;
            console.log('Set default model to:', firstEnabledModel);
          }
        }
        
        saveSettings(updatedSettings);
        
        window.dispatchEvent(new CustomEvent('settings-updated', { 
          detail: { defaultModel: updatedSettings.defaultModel }
        }));
        
        console.log('Models initialized successfully');
      } else {
        console.warn('Failed to fetch models on initialization:', result?.message || 'Unknown error');
      }
    }
  }
}        