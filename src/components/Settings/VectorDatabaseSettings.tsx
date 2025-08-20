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
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { Plus, Edit, Trash, Database, HardDrive, Cloud, Info } from 'lucide-react';
import { vectorDbService } from '../../services/VectorDbService';
import { VectorDbConfig } from '../../types/vectorDb';

// Default Docker configurations for vector databases
const DEFAULT_MILVUS_DOCKER = `version: '3.5'

services:
  etcd:
    container_name: milvus-etcd
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - ${PWD}/volumes/etcd:/etcd
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd

  minio:
    container_name: milvus-minio
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - ${PWD}/volumes/minio:/minio_data
    command: minio server /minio_data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  standalone:
    container_name: milvus-standalone
    image: milvusdb/milvus:v2.2.8
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - ${PWD}/volumes/milvus:/var/lib/milvus
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - "etcd"
      - "minio"

networks:
  default:
    name: milvus
`;

const DEFAULT_QDRANT_DOCKER = `version: '3.7'

services:
  qdrant:
    image: qdrant/qdrant:v1.1.1
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ${PWD}/volumes/qdrant:/qdrant/storage
    networks:
      - qdrant-network

networks:
  qdrant-network:
    driver: bridge
`;

export const VectorDatabaseSettings: React.FC<{
  onConfigurationChange?: () => void;
}> = ({ onConfigurationChange }) => {
  const [configurations, setConfigurations] = useState<VectorDbConfig[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<VectorDbConfig | null>(null);
  const [formData, setFormData] = useState<VectorDbConfig>({
    id: '',
    name: '',
    type: 'milvus',
    host: 'localhost',
    port: 19530,
    user: '',
    password: '',
    collection: '',
    isDefault: false
  });
  const [isNew, setIsNew] = useState(true);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load configurations on mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  // Load vector database configurations
  const loadConfigurations = () => {
    const configs = vectorDbService.getConfigurations();
    setConfigurations(configs);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof VectorDbConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Open edit dialog for a configuration
  const handleEdit = (config: VectorDbConfig) => {
    setCurrentConfig(config);
    setFormData({ ...config });
    setIsNew(false);
    setEditDialogOpen(true);
  };

  // Open dialog to add a new configuration
  const handleAdd = () => {
    setCurrentConfig(null);
    setFormData({
      id: Date.now().toString(),
      name: '',
      type: 'milvus',
      host: 'localhost',
      port: 19530,
      user: '',
      password: '',
      collection: '',
      isDefault: configurations.length === 0 // Make default if it's the first one
    });
    setIsNew(true);
    setEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (config: VectorDbConfig) => {
    setCurrentConfig(config);
    setDeleteDialogOpen(true);
  };

  // Delete a configuration
  const handleDelete = () => {
    if (currentConfig) {
      vectorDbService.deleteConfiguration(currentConfig.id);
      loadConfigurations();
      if (onConfigurationChange) {
        onConfigurationChange();
      }
    }
    setDeleteDialogOpen(false);
  };

  // Save a configuration
  const handleSave = () => {
    if (isNew) {
      vectorDbService.addConfiguration(formData);
    } else {
      vectorDbService.updateConfiguration(formData);
    }
    
    loadConfigurations();
    setEditDialogOpen(false);
    
    if (onConfigurationChange) {
      onConfigurationChange();
    }
  };

  // Test connection to a vector database
  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestStatus(null);
    
    try {
      const success = await vectorDbService.testConnection(formData);
      setTestStatus(success ? 'success' : 'error');
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Set a configuration as default
  const handleSetDefault = (config: VectorDbConfig) => {
    vectorDbService.setDefaultConfiguration(config.id);
    loadConfigurations();
    
    if (onConfigurationChange) {
      onConfigurationChange();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vector Database Configurations</h3>
        <Button onClick={handleAdd} size="sm" className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add Configuration
        </Button>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure connections to vector databases for document storage and retrieval.
          You can use local Docker instances or connect to remote services.
        </AlertDescription>
      </Alert>
      
      {configurations.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No vector database configurations yet.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add a configuration to start storing and retrieving documents.
          </p>
          <Button onClick={handleAdd} variant="outline" size="sm" className="flex items-center gap-1 mx-auto">
            <Plus className="h-4 w-4" />
            Add Configuration
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {configurations.map((config) => (
            <Card key={config.id} className={`${config.isDefault ? 'border-primary' : ''}`}>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {config.name}
                  </CardTitle>
                  {config.isDefault && (
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
                          onClick={() => handleEdit(config)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(config)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    {config.type === 'milvus' ? (
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" /> Milvus
                      </span>
                    ) : config.type === 'qdrant' ? (
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" /> Qdrant
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Cloud className="h-3 w-3" /> {config.type}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Host:</span> {config.host}:{config.port}
                  </div>
                  {config.collection && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Collection:</span> {config.collection}
                    </div>
                  )}
                </div>
                
                {!config.isDefault && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSetDefault(config)}
                    className="mt-2"
                  >
                    Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add Vector Database' : 'Edit Vector Database'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="My Vector Database"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="milvus">Milvus</SelectItem>
                  <SelectItem value="qdrant">Qdrant</SelectItem>
                  <SelectItem value="pinecone">Pinecone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="host" className="text-sm font-medium">Host</label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="localhost"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="port" className="text-sm font-medium">Port</label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                  placeholder="19530"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="user" className="text-sm font-medium">Username (optional)</label>
                <Input
                  id="user"
                  value={formData.user}
                  onChange={(e) => handleInputChange('user', e.target.value)}
                  placeholder="username"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password (optional)</label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="password"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="collection" className="text-sm font-medium">Collection Name (optional)</label>
              <Input
                id="collection"
                value={formData.collection}
                onChange={(e) => handleInputChange('collection', e.target.value)}
                placeholder="my_collection"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default collection name.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
              />
              <label htmlFor="isDefault" className="text-sm font-medium">
                Set as default vector database
              </label>
            </div>
            
            {(formData.type === 'milvus' || formData.type === 'qdrant') && formData.host === 'localhost' && (
              <div className="space-y-2">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Docker Configuration</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Use this docker-compose.yml to set up a local instance of {formData.type === 'milvus' ? 'Milvus' : 'Qdrant'}.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-auto max-h-40">
                  {formData.type === 'milvus' ? DEFAULT_MILVUS_DOCKER : DEFAULT_QDRANT_DOCKER}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTestConnection}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                {isLoading ? (
                  <Progress value={80} className="w-4 h-4 animate-spin" />
                ) : null}
                Test Connection
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
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Vector Database</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete the vector database configuration "{currentConfig?.name}"?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This will only remove the configuration, not the actual database or its data.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
