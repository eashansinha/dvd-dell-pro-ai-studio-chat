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
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppDispatch, loadSession } from '../../store/store';
import { getDB } from '../../db/db';
import type { SessionDocType, MessageDocType } from '../../db/types';

interface ChatHistoryItemProps {
  session: SessionDocType;
  isActive: boolean;
  onDelete: (sessionId: string) => void;
}

export const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({
  session,
  isActive,
  onDelete
}) => {
  const dispatch = useAppDispatch();

  const handleSelectSession = async () => {
    const db = await getDB();
    // Fetch all messages for this session
    const messagePromises = session.messages.map(msgId =>
      db.messages.findOne(msgId).exec()
    );

    const messageResults = await Promise.all(messagePromises);
    const messages = messageResults
      .filter(Boolean)
      .map(doc => doc!.toJSON() as MessageDocType);

    // Load the selected session into Redux
    dispatch(loadSession({
      sessionId: session.sessionId,
      messages
    }));
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(session.sessionId);
  };

  // Format dates
  const formattedDate = new Date(session.createdAt).toLocaleDateString();
  const formattedTime = new Date(session.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="relative">
      <button
        onClick={handleSelectSession}
        className={`w-full text-left rounded px-3 py-2 mb-1 transition-colors duration-200 relative ${
          isActive 
            ? 'bg-accent text-accent-foreground' 
            : 'hover:bg-accent/50'
        }`}
      >
        <div className="pr-8">
          <div className="font-medium text-sm truncate text-foreground">
            {session.title}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {formattedDate}, {formattedTime}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label="delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </button>
    </div>
  );
};
