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
import { MessageDocType } from '../../db/types';

interface ChatWindowProps {
  messages: MessageDocType[];
  isThinking: boolean;
  thinkingTokens: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isThinking, thinkingTokens }) => {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col p-4">
      <div className="space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`inline-block rounded-lg p-2 max-w-[60%] ${
                msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-gray-300 text-black'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {isThinking && (
        <div className="mt-auto border-t border-gray-300 pt-4">
          <p className="text-sm text-muted-foreground">
            Thinking...
          </p>
          <div className="bg-gray-100 p-2 mt-2 rounded">
            {thinkingTokens}
          </div>
        </div>
      )}
    </div>
  );
};
