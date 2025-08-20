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
import { CloudOff, Cloud } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { useOffline } from '../../context/OfflineContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useOffline();
  const [showAlert, setShowAlert] = React.useState(false);
  const [prevOnlineState, setPrevOnlineState] = React.useState(isOnline);

  React.useEffect(() => {
    // Show alert when going offline or coming back online
    if (prevOnlineState !== isOnline) {
      setShowAlert(true);
      setPrevOnlineState(isOnline);
    }
  }, [isOnline, prevOnlineState]);

  const handleClose = () => {
    setShowAlert(false);
  };

  return (
    <>
      {/* Persistent offline chip in the top right corner */}
      {!isOnline && (
        <Badge
          variant="secondary"
          className="fixed top-4 right-4 z-[9999] bg-yellow-100 text-yellow-800 border-yellow-300"
        >
          <CloudOff className="w-3 h-3 mr-1" />
          Offline Mode
        </Badge>
      )}

      {/* Alert when status changes */}
      {showAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9998] w-full max-w-md">
          <Alert className={`${isOnline ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
            <div className="flex items-center">
              {isOnline ? <Cloud className="h-4 w-4 text-green-600" /> : <CloudOff className="h-4 w-4 text-yellow-600" />}
              <AlertDescription className={`ml-2 ${isOnline ? 'text-green-800' : 'text-yellow-800'}`}>
                {isOnline
                  ? 'Back online! All features are available.'
                  : 'You are offline. Company chat features requiring remote access are unavailable.'}
              </AlertDescription>
              <button
                onClick={handleClose}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </Alert>
        </div>
      )}
    </>
  );
};  