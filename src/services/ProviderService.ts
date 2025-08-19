/*
 * Copyright © 2025 Dell Inc. or its subsidiaries. All Rights Reserved.
 *
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

import { getSettings } from '../utils/settings';

export type AIProvider = 'dell-pro-ai-studio' | 'ollama';

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  modelsEndpoint: string;
  chatEndpoint: string;
  requiresAuth: boolean;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

export class ProviderService {
  static getProviderConfig(provider: AIProvider): ProviderConfig {
    const settings = getSettings();
    
    switch (provider) {
      case 'dell-pro-ai-studio':
        return {
          name: 'Dell Pro AI Studio',
          baseUrl: settings.apiBaseUrl || 'http://localhost:8553/v1/openai',
          apiKey: settings.apiKey || 'dpais',
          modelsEndpoint: '/models',
          chatEndpoint: '/chat/completions',
          requiresAuth: true
        };
      
      case 'ollama':
        return {
          name: 'Ollama',
          baseUrl: settings.ollamaBaseUrl || 'http://localhost:11434',
          apiKey: '',
          modelsEndpoint: '/api/tags',
          chatEndpoint: '/v1/chat/completions',
          requiresAuth: false
        };
      
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  static async fetchOllamaModels(baseUrl: string): Promise<string[]> {
    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const data: OllamaModelsResponse = await response.json();
      return data.models.map(model => model.name);
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      throw error;
    }
  }

  static getEffectiveApiUrl(provider: AIProvider): string {
    const config = this.getProviderConfig(provider);
    return provider === 'ollama' ? `${config.baseUrl}/v1` : config.baseUrl;
  }
}
