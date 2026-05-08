import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { registerServiceWorker, applyUpdate } from '@/pwa/registerServiceWorker';
import { startReminderTimer, clearReminderTimer } from '@/pwa/reminderLogic';

interface PWAUpdateState {
  updateAvailable: boolean;
  showDialog: boolean;
  showBanner: boolean;
}

interface PWAUpdateContextType extends PWAUpdateState {
  handleReload: () => void;
  handleLater: () => void;
  handleCloseDialog: () => void;
  handleCloseBanner: () => void;
}

const PWAUpdateContext = createContext<PWAUpdateContextType | undefined>(undefined);

export const usePWAUpdate = () => {
  const context = useContext(PWAUpdateContext);
  if (!context) {
    throw new Error('usePWAUpdate must be used within a PWAUpdateProvider');
  }
  return context;
};

export const PWAUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PWAUpdateState>({
    updateAvailable: false,
    showDialog: false,
    showBanner: false,
  });

  const reminderTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we just reloaded due to PWA update
  const checkJustReloaded = () => {
    const flag = sessionStorage.getItem('pwa-just-reloaded');
    if (flag) {
      sessionStorage.removeItem('pwa-just-reloaded');
      return true;
    }
    return false;
  };

  const justReloaded = useRef(checkJustReloaded()).current;

  const clearTimers = () => {
    if (reminderTimerRef.current) {
      clearReminderTimer(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
  };

  const showUpdateDialog = () => {
    setState((prev) => ({
      ...prev,
      showDialog: true,
      showBanner: false,
    }));
  };

  const handleUpdateAvailable = () => {
    // Don't show popup immediately after reload
    if (justReloaded) {
      console.log('Just reloaded, skipping PWA update notification');
      return;
    }

    setState((prev) => ({
      ...prev,
      updateAvailable: true,
      showDialog: true,
    }));

    // Start reminder timer
    if (reminderTimerRef.current) {
      clearReminderTimer(reminderTimerRef.current);
    }
    reminderTimerRef.current = startReminderTimer(showUpdateDialog);
  };

  const handleReload = () => {
    clearTimers();
    applyUpdate();
  };

  const handleLater = () => {
    setState((prev) => ({
      ...prev,
      showDialog: false,
      showBanner: true,
    }));
  };

  const handleCloseDialog = () => {
    setState((prev) => ({
      ...prev,
      showDialog: false,
    }));
  };

  const handleCloseBanner = () => {
    setState((prev) => ({
      ...prev,
      showBanner: false,
    }));
  };

  useEffect(() => {
    // Skip PWA registration in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('PWA context disabled in development mode');
      return;
    }

    // Register service worker
    registerServiceWorker(handleUpdateAvailable);

    return () => {
      clearTimers();
    };
  }, []);

  const contextValue: PWAUpdateContextType = {
    ...state,
    handleReload,
    handleLater,
    handleCloseDialog,
    handleCloseBanner,
  };

  return <PWAUpdateContext.Provider value={contextValue}>{children}</PWAUpdateContext.Provider>;
};
