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
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Switch } from '../ui/switch';
import {
  Search,
  Cloud,
  HardDrive,
  Database,
  Filter,
  FilterX,
  MessageCircle,
  Plus,
  CheckCircle,
  Info,
  RefreshCw,
  Tag,
  CloudOff
} from 'lucide-react';
import { vectorDbService } from '../../services/VectorDbService';
import { VectorDbConfig } from '../../types/vectorDb';
import { useAppDispatch, useAppSelector, startSession } from '../../store/store';
import { useRagContext } from '../../context/RagContext';
import { useToast } from '../ui/use-toast';

// Database item component
const DatabaseItem: React.FC<{
  database: VectorDbConfig;
  onAddToChat: (database: VectorDbConfig) => void;
  isSelected: boolean;
}> = ({ database, onAddToChat, isSelected }) => {
  const [expanded, setExpanded] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load tags for the database
  useEffect(() => {
    if (expanded && !tags.length && !isLoading) {
      loadTags();
    }
  }, [expanded]);

  // Load tags from the vector database
  const loadTags = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedTags = await vectorDbService.getTags(database);
      setTags(fetchedTags);
    } catch (err) {
      console.error('Error loading tags:', err);
      setError('Failed to load tags');
      toast({
        title: 'Error',
        description: 'Failed to load tags from database',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get a color for a tag based on its name
  const getTagColor = (tag: string) => {
    const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-yellow-100 text-yellow-800', 'bg-red-100 text-red-800'];
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Card className={`mb-2 ${isSelected ? 'border-primary' : ''}`}>
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base flex items-center gap-1">
            {database.type === 'milvus' ? (
              <HardDrive className="h-4 w-4" />
            ) : database.type === 'qdrant' ? (
              <Database className="h-4 w-4" />
            ) : (
              <Cloud className="h-4 w-4" />
            )}
            {database.name}
          </CardTitle>
          {database.isDefault && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Default
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setExpanded(!expanded)}
                  className="h-8 w-8"
                >
                  {expanded ? <FilterX className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{expanded ? 'Hide tags' : 'Show tags'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isSelected ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => onAddToChat(database)}
                  className="flex items-center gap-1"
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-3 w-3" />
                      <span>Add to Chat</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSelected ? 'Already added to chat' : 'Add this database to the current chat'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="p-3">
        <div className="text-sm text-muted-foreground mb-2">
          {database.host}:{database.port}
          {database.collection && ` • ${database.collection}`}
        </div>
        
        {expanded && (
          <div className="mt-2">
            <Separator className="my-2" />
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Tag className="h-3 w-3" /> Tags
              </h4>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={loadTags}
                disabled={isLoading}
                className="h-6 w-6"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-2">
                <Progress value={80} className="w-24 h-1" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="p-2 text-xs">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : tags.length === 0 ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                No tags found
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline"
                    className={`text-xs ${getTagColor(tag)}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main component
export const CompanyDocuments: React.FC = () => {
  const [databases, setDatabases] = useState<VectorDbConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(state => state.currentSession);
  const { setRagEnabled } = useRagContext();
  const { toast } = useToast();

  // Load databases on mount
  useEffect(() => {
    loadDatabases();
    
    // Check if any databases are already selected in the current session
    if (currentSession?.vectorDbs?.length) {
      setSelectedDatabases(currentSession.vectorDbs.map(db => db.id));
    }
  }, [currentSession?.id]);

  // Load vector databases
  const loadDatabases = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const configs = vectorDbService.getConfigurations();
      setDatabases(configs);
      
      // Check connectivity
      const online = await vectorDbService.checkConnectivity();
      setIsOffline(!online);
    } catch (err) {
      console.error('Error loading databases:', err);
      setError('Failed to load vector databases');
      toast({
        title: 'Error',
        description: 'Failed to load vector databases',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter databases based on search term
  const filteredDatabases = databases.filter(db => 
    db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    db.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    db.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add a database to the chat
  const handleAddToChat = (database: VectorDbConfig) => {
    if (selectedDatabases.includes(database.id)) {
      // Remove from selection
      setSelectedDatabases(prev => prev.filter(id => id !== database.id));
      
      // Update session
      if (currentSession) {
        dispatch(startSession({
          ...currentSession,
          vectorDbs: (currentSession.vectorDbs || []).filter(db => db.id !== database.id)
        }));
      }
      
      toast({
        description: `Removed ${database.name} from chat`
      });
    } else {
      // Add to selection
      setSelectedDatabases(prev => [...prev, database.id]);
      
      // Update session
      if (currentSession) {
        dispatch(startSession({
          ...currentSession,
          vectorDbs: [...(currentSession.vectorDbs || []), database]
        }));
      }
      
      toast({
        description: `Added ${database.name} to chat`
      });
    }
    
    // Update RAG context
    setRagEnabled(true);
  };

  // Toggle offline mode
  const handleToggleOffline = (checked: boolean) => {
    setIsOffline(!checked);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vector Databases</h3>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={loadDatabases}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh databases</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="online-mode"
              checked={!isOffline}
              onCheckedChange={handleToggleOffline}
            />
            <label htmlFor="online-mode" className="text-sm flex items-center gap-1">
              {isOffline ? (
                <>
                  <CloudOff className="h-3 w-3" />
                  <span>Offline</span>
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3" />
                  <span>Online</span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search databases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Progress value={80} className="w-40 h-2" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : databases.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No vector databases configured</p>
          <p className="text-sm text-muted-foreground mb-4">
            Configure vector databases in Settings to enable document retrieval.
          </p>
          <Button variant="outline" size="sm" className="mx-auto">
            Open Settings
          </Button>
        </div>
      ) : filteredDatabases.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No databases match your search</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDatabases.map((database) => (
            <DatabaseItem
              key={database.id}
              database={database}
              onAddToChat={handleAddToChat}
              isSelected={selectedDatabases.includes(database.id)}
            />
          ))}
        </div>
      )}
      
      {isOffline && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You are in offline mode. Document retrieval is disabled.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
