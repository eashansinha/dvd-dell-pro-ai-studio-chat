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
 * Offline indicator component that displays connection status to users
 * Shows persistent offline chip and temporary alerts when connection status changes
 */

import React from 'react';
import { Snackbar, Alert, Chip } from '@mui/material';
import { CloudOff, Cloud } from '@mui/icons-material';
import { useOffline } from '../../context/OfflineContext';

/**
 * Component that provides visual feedback about online/offline status
 * Displays a persistent chip when offline and shows alerts on status changes
 * @returns JSX element containing offline status indicators
 */
export const OfflineIndicator: React.FC = () => {
  const { isOnline, isServiceWorkerReady } = useOffline();
  const [showAlert, setShowAlert] = React.useState(false);
  const [prevOnlineState, setPrevOnlineState] = React.useState(isOnline);

  React.useEffect(() => {
    // Show alert when going offline or coming back online
    if (prevOnlineState !== isOnline) {
      setShowAlert(true);
      setPrevOnlineState(isOnline);
    }
  }, [isOnline, prevOnlineState]);

  /**
   * Handle closing the status change alert
   */
  const handleClose = () => {
    setShowAlert(false);
  };

  return (
    <>
      {/* Persistent offline chip in the top right corner */}
      {!isOnline && (
        <Chip
          icon={<CloudOff />}
          label="Offline Mode"
          color="warning"
          size="small"
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 9999,
          }}
        />
      )}

      {/* Alert when status changes */}
      <Snackbar
        open={showAlert}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={isOnline ? 'success' : 'warning'}
          icon={isOnline ? <Cloud /> : <CloudOff />}
          sx={{ width: '100%' }}
        >
          {isOnline
            ? 'Back online! All features are available.'
            : 'You are offline. Company chat features requiring remote access are unavailable.'}
        </Alert>
      </Snackbar>
    </>
  );
};  