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

import React, { useState } from 'react';
import { 
  Monitor, 
  Apple, 
  Terminal, 
  Copy 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Card } from '../ui/card';
import { getSettings, saveSettings } from '../../utils/settings';

interface DownloadsPathDialogProps {
  open: boolean;
  onClose: (path?: string) => void;
}

interface PlatformInstructions {
  icon: React.ReactNode;
  name: string;
  example: string;
  steps: string[];
}

export const DownloadsPathDialog: React.FC<DownloadsPathDialogProps> = ({ open, onClose }) => {
  const [path, setPath] = useState('');
  const [error, setError] = useState('');

  const platforms: PlatformInstructions[] = [
    {
      icon: <Monitor className="h-4 w-4" />,
      name: 'Windows',
      example: 'C:\\Users\\YourUsername\\Downloads',
      steps: [
        'Open File Explorer',
        'Navigate to your Downloads folder',
        'Click in the address bar at the top',
        'Copy the full path (e.g., C:\\Users\\YourUsername\\Downloads)',
        'Paste it in the field below'
      ]
    },
    {
      icon: <Apple className="h-4 w-4" />,
      name: 'macOS',
      example: '/Users/YourUsername/Downloads',
      steps: [
        'Open Finder',
        'Navigate to Downloads folder',
        'Right-click on Downloads in the sidebar',
        'Hold Option key and select "Copy Downloads as Pathname"',
        'Or in Terminal, type: echo ~/Downloads | pbcopy'
      ]
    },
    {
      icon: <Terminal className="h-4 w-4" />,
      name: 'Linux',
      example: '/home/YourUsername/Downloads',
      steps: [
        'Open Terminal',
        'Type: echo ~/Downloads',
        'Copy the output path',
        'Or type: pwd after navigating to Downloads folder',
        'Paste the path in the field below'
      ]
    }
  ];

  const handleCopyExample = (example: string) => {
    // Replace YourUsername with actual username if possible
    const username = (window as any).username || 'YourUsername';
    const actualPath = example.replace('YourUsername', username);
    navigator.clipboard.writeText(actualPath);
  };

  const handleSave = () => {
    if (!path.trim()) {
      setError('Please enter a path');
      return;
    }

    // Basic path validation
    const isWindowsPath = /^[A-Za-z]:\\/.test(path);
    const isUnixPath = path.startsWith('/') || path.startsWith('~');
    
    if (!isWindowsPath && !isUnixPath) {
      setError('Please enter a valid absolute path');
      return;
    }

    // Save to settings
    const settings = getSettings();
    saveSettings({
      ...settings,
      downloadsPath: path.trim()
    });

    onClose(path.trim());
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Downloads Folder Path</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              To open files directly in VS Code, we need to know where your Downloads folder is located.
              This is a one-time setup.
            </AlertDescription>
          </Alert>

          <div>
            <h4 className="text-sm font-medium mb-3">
              Select your operating system for instructions:
            </h4>

            <Accordion type="single" collapsible className="w-full">
              {platforms.map((platform) => (
                <AccordionItem key={platform.name} value={platform.name}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      {platform.icon}
                      <span>{platform.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">
                          <strong>Example path:</strong>
                        </p>
                        <Card className="p-3 bg-muted flex items-center justify-between">
                          <code className="text-sm">{platform.example}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyExample(platform.example)}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                        </Card>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">
                          <strong>Steps to get your path:</strong>
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {platform.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="space-y-2">
            <label htmlFor="path-input" className="text-sm font-medium">
              Downloads Folder Path
            </label>
            <Input
              id="path-input"
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setError('');
              }}
              placeholder="e.g., C:\\Users\\YourName\\Downloads or /Users/YourName/Downloads"
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {!error && (
              <p className="text-sm text-muted-foreground">
                Paste your Downloads folder path here
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Path
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};    