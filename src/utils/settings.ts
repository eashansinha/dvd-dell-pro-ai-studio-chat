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

/**
 * Settings utilities for managing application configuration
 * Handles loading, saving, and default settings for the chat application
 */

import { AppSettings } from '../components/Settings/Settings';

/**
 * Default settings that should be used when localStorage is empty
 * Provides fallback configuration for first-time users
 */
export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: 'http://localhost:8553/v1/openai',
  backendApiUrl: 'http://localhost:8000',
  apiKey: 'dpais',
  selectedTheme: 'light',
  embeddingsModel: 'nomic-embed-text-v1.5',
  availableModels: [],
  systemMessage: '',
  documentChunkSize: 1000,
  documentOverlap: 200,
  maxDocumentsRetrieved: 5,
  downloadsPath: '',
  companyDocumentsEnabled: false
};

/**
 * Get settings from localStorage with defaults fallback
 * This ensures we always have valid settings even on first load
 * @returns Complete AppSettings object with all required fields
 */
export function getSettings(): AppSettings {
  try {
    const savedSettings = localStorage.getItem('chatAppSettings');
    if (savedSettings) {
      // Merge saved settings with defaults to ensure all fields are present
      const parsed = JSON.parse(savedSettings);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  
  // Return defaults if no saved settings or parsing failed
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage with error handling
 * @param settings - The settings object to persist
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem('chatAppSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}  