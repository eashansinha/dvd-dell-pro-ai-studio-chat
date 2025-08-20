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
 * Offline context provider for managing network connectivity and service worker state
 * Provides real-time network status and service worker readiness information
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Type definition for offline context state
 */
interface OfflineContextType {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
}

/**
 * Offline context instance with default values
 */
const OfflineContext = createContext<OfflineContextType>({
  isOnline: navigator.onLine,
  isServiceWorkerReady: false,
});

/**
 * Custom hook to access offline context
 * @returns Offline context value with network and service worker status
 */
export const useOffline = () => useContext(OfflineContext);

/**
 * Props for the OfflineProvider component
 */
interface OfflineProviderProps {
  children: ReactNode;
}

/**
 * Offline provider component that tracks network connectivity and service worker status
 * @param props - Component props containing child components
 * @returns JSX element providing offline context to children
 */
export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if service worker is ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline, isServiceWorkerReady }}>
      {children}
    </OfflineContext.Provider>
  );
};  