import React, { useEffect } from 'react';
import { usePWAUpdate } from '@/contexts/PWAUpdateContext';
import { PWAUpdateManager } from './PWAUpdateManager';

interface PWAWrapperProps {
  children: React.ReactNode;
}

export function PWAWrapper({ children }: PWAWrapperProps) {
  const { showBanner } = usePWAUpdate();

  useEffect(() => {
    // Add/remove padding to body when banner is visible
    if (showBanner) {
      document.body.style.paddingTop = '40px';
      document.documentElement.style.setProperty('--pwa-banner-height', '40px');
    } else {
      document.body.style.paddingTop = '0px';
      document.documentElement.style.setProperty('--pwa-banner-height', '0px');
    }

    // Cleanup on unmount
    return () => {
      document.body.style.paddingTop = '0px';
      document.documentElement.style.setProperty('--pwa-banner-height', '0px');
    };
  }, [showBanner]);

  return (
    <>
      {/* Banner at top when visible */}
      {showBanner && <PWAUpdateManager />}

      {/* Main content */}
      <div>{children}</div>

      {/* Dialog when banner not shown */}
      {!showBanner && <PWAUpdateManager />}
    </>
  );
}
