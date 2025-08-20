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

import React from 'react';
import { Monitor, Download, Building } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';

export const MobileLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center py-8">
      <div className="container max-w-lg mx-auto px-4">
        <Card className="p-8 text-center rounded-3xl shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-600">
          {/* Logo/Icon */}
          <div className="w-24 h-24 rounded-lg bg-primary flex items-center justify-center mx-auto mb-6 relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent">
            <h2 className="text-3xl font-bold text-white font-sans">
              AI
            </h2>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Dell Pro AI Studio Chat
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            A place to test out your AI PCs powered by Dell Pro AI Studio
          </p>

          <Separator className="my-6" />

          {/* Main message */}
          <p className="text-left mb-6">
            In order to use Dell Pro AI Studio Chat, you need to be on a Dell AI PC.
          </p>

          {/* Purchase AI PC Section */}
          <Card className="p-6 mb-6 rounded-lg bg-muted/50">
            <CardContent className="p-0">
              <Monitor className="h-10 w-10 text-primary mb-2 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">
                Get a Dell AI PC
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Experience the power of on-device AI with Dell's latest AI-powered PCs
              </p>
              <Button
                className="w-full"
                asChild
              >
                <a
                  href="https://www.dell.com/en-us/lp/learn-about-ai-pcs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Shop Dell AI PCs
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Download Dell Pro AI Studio Section */}
          <Card className="p-6 mb-6 rounded-lg bg-muted/50">
            <CardContent className="p-0">
              <Download className="h-10 w-10 text-secondary mb-2 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">
                Download Dell Pro AI Studio
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the runtime and management layer for AI on your Dell device
              </p>
              <Button
                variant="secondary"
                className="w-full"
                asChild
              >
                <a
                  href="https://dell.com/DellProAIStudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Dell Pro AI Studio
                </a>
              </Button>
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {/* About Dell Pro AI Studio */}
          <div className="text-left mb-6">
            <h3 className="text-lg font-semibold mb-2">
              What is Dell Pro AI Studio?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Dell Pro AI Studio is the on-device runtime and management layer that enables 
              organizations to deploy, execute, and manage AI models directly on Dell client 
              devices. It provides centralized control for IT teams to configure, monitor, 
              and update AI workloads, while ensuring models are optimized for the device's 
              hardware (CPU, GPU, NPU).
            </p>
            <p className="text-sm text-muted-foreground">
              With support for policy-based deployment, version control, and runtime plugin 
              management, it simplifies the operational side of running AI locally to empower 
              scalable, secure, and efficient on-client AI execution.
            </p>
          </div>

          {/* Enterprise Link */}
          <Card className="p-4 rounded-lg bg-muted/30">
            <CardContent className="p-0">
              <Building className="h-8 w-8 text-blue-600 mb-2 mx-auto" />
              <h4 className="text-base font-medium mb-2">
                Enterprise Deployment
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                For more information on deployment of Dell Pro AI Studio within an 
                enterprise environment:
              </p>
              <a
                href="https://dell.com/DellManagementPortal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                Dell Management Portal - Dell Pro AI Studio
              </a>
            </CardContent>
          </Card>
        </Card>
      </div>
    </div>
  );
};  