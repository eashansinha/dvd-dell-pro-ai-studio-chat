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

export type ThemeMode = 'light' | 'dark' | 'oled';

export interface ThemeConfig {
  mode: ThemeMode;
  primary: string;
  secondary: string;
  background: string;
  paper: string;
  text: string;
  accent: string;
}

// Default themes
export const DEFAULT_THEMES = {
  light: {
    mode: 'light',
    primary: '#002A58',
    secondary: '#6366f1',
    background: '#ffffff',
    paper: '#f9fafb',
    text: '#213547',
    accent: '#646cff'
  } as ThemeConfig,
  
  dark: {
    mode: 'dark',
    primary: '#97DCF4',
    secondary: '#C47AF4',
    background: '#1e1e2e',
    paper: '#2a2a3c',
    text: '#e2e8f0',
    accent: '#818cf8'
  } as ThemeConfig,
  
  oled: {
    mode: 'oled',
    primary: '#61C1EB',
    secondary: '#C47AF4',
    background: '#000000',
    paper: '#000',
    text: '#f0f0f0',
    accent: '#00bfff'
  } as ThemeConfig
};

export function applyTheme(config: ThemeConfig) {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    root.classList.remove('light', 'dark', 'theme-oled');
    
    if (config.mode === 'oled') {
      root.classList.add('theme-oled');
    } else if (config.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
    
    root.style.setProperty('--dell-primary-color', config.primary);
    root.style.setProperty('--dell-secondary-color', config.secondary);
    root.style.setProperty('--dell-background-color', config.background);
    root.style.setProperty('--dell-paper-color', config.paper);
    root.style.setProperty('--dell-text-color', config.text);
    root.style.setProperty('--dell-accent-color', config.accent);
  }
}
