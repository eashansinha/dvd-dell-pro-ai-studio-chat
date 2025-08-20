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

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { useAppSelector, useAppDispatch, setCurrentModel } from '../../store/store';

interface Model {
  id: string;
  name: string;
  enabled: boolean;
  isDefault?: boolean;
  tag?: string;
}

export const ModelSelector: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedModel = useAppSelector(state => state.chat.currentModel);
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    
    useEffect(() => {
        // Load models from settings
        const fetchModels = () => {
            const savedSettings = JSON.parse(localStorage.getItem('chatAppSettings') || '{}');
            const enabledModels = savedSettings.enabledModels || {};
            const defaultModel = savedSettings.defaultModel || 'phi3:phi3-mini-4k';
            const modelTags = savedSettings.modelTags || {};
            
            // Get the list of models
            if (savedSettings.availableModels && savedSettings.availableModels.length > 0) {
                const models: Model[] = savedSettings.availableModels.map((modelId: string) => ({
                    id: modelId,
                    name: getModelDisplayName(modelId),
                    enabled: enabledModels[modelId] !== false, // Default to enabled unless explicitly disabled
                    isDefault: modelId === defaultModel,
                    tag: modelTags[modelId] || null
                }));
                setAvailableModels(models);
                
                // Check if current selected model is valid
                const isCurrentModelValid = selectedModel && models.some(model => model.id === selectedModel && model.enabled);
                
                // Prioritize setting model based on these conditions:
                // 1. If current model is invalid or empty, and we have a default model that exists in available models
                // 2. If current model is invalid or empty, select first enabled model
                // 3. If current model is the old fallback, replace it with the new default
                
                if (defaultModel && models.some(model => model.id === defaultModel && model.enabled)) {
                    // If we have a valid default model and (no current selection OR current selection is invalid OR it's the old fallback)
                    if (!selectedModel || !isCurrentModelValid || selectedModel === 'deepseek-r1:7b' || selectedModel === 'phi3:phi3-mini-4k') {
                        dispatch(setCurrentModel(defaultModel));
                        console.log('Set model to default:', defaultModel);
                    }
                } else if (!isCurrentModelValid && models.length > 0) {
                    // If no valid default but we have models, select the first enabled model
                    const firstEnabledModel = models.find((model: Model) => model.enabled);
                    if (firstEnabledModel) {
                        dispatch(setCurrentModel(firstEnabledModel.id));
                        console.log('Set model to first available:', firstEnabledModel.id);
                    }
                }
            } else {
                // Fallback to hardcoded models if none available
                setAvailableModels([]);
            }
        };
        
        fetchModels();
        
        // Listen for settings changes
        const handleSettingsUpdate = () => {
            fetchModels();
        };
        
        window.addEventListener('settings-updated', handleSettingsUpdate);
        return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
    }, [dispatch, selectedModel]);
    
    // Convert model ID to display name
    const getModelDisplayName = (modelId: string): string => {
        // First remove compute-type prefix if present
        let displayName = modelId;
        const prefixes = ['public-cloud/', 'private-cloud/', 'GPU/', 'NPU/', 'CPU/', 'dNPU/'];
        
        for (const prefix of prefixes) {
            if (displayName.startsWith(prefix)) {
                displayName = displayName.substring(prefix.length);
                break;
            }
        }
        
        // Then parse remaining model ID for the name part
        const parts = displayName.split(':');
        if (parts.length >= 2) {
            // Just return the model name part, without the parameter size
            const model = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            return model;
        }
        return displayName;
    };
    
    // Extract parameter size from model ID if present
    const getParameterSize = (modelId: string): string | null => {
        const parts = modelId.split(':');
        if (parts.length >= 2) {
            return parts[1]; // Return the parameter size part
        }
        return null;
    };

    const handleModelChange = (modelId: string) => {
        dispatch(setCurrentModel(modelId));
    };

    // Only show enabled models
    const enabledModels = availableModels.filter(model => model.enabled);

    // Helper function to get tag color based on compute location
    const getTagColor = (tag: string): string => {
        switch(tag) {
            case 'public-cloud':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'private-cloud':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'GPU':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'NPU':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'CPU':
                return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'dNPU':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="min-w-[150px]">
            <Select value={selectedModel || ''} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[18vw] max-w-[400px] h-[6vh] rounded-lg bg-background text-sm">
                    <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                    {enabledModels.map(model => {
                        const paramSize = getParameterSize(model.id);
                        return (
                            <SelectItem key={model.id} value={model.id}>
                                <div className="w-full flex items-center justify-between gap-2">
                                    <span className={`flex-shrink-0 min-w-[100px] text-sm ${
                                        selectedModel === model.id ? 'font-bold' : 'font-medium'
                                    }`}>
                                        {model.name}
                                    </span>
                                    <div className="flex gap-1 flex-wrap justify-end">
                                        {model.isDefault && (
                                            <Badge variant="outline" className="h-[18px] text-[0.65rem] px-2 py-0 bg-purple-100 text-purple-800 border-purple-300">
                                                Default
                                            </Badge>
                                        )}
                                        {model.tag && (
                                            <Badge variant="outline" className={`h-[18px] text-[0.65rem] px-2 py-0 ${getTagColor(model.tag)}`}>
                                                {model.tag}
                                            </Badge>
                                        )}
                                        {paramSize && (
                                            <Badge variant="outline" className="h-[18px] text-[0.65rem] px-2 py-0 bg-blue-100 text-blue-800 border-blue-300">
                                                {paramSize}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
};
