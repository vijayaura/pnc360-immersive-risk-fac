import { Workbox } from 'workbox-window';

let updateAvailableCallback: (() => void) | null = null;

export function registerServiceWorker(onUpdateAvailable: () => void) {
  updateAvailableCallback = onUpdateAvailable;

  // Skip all PWA functionality in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('PWA update functionality disabled in development mode');
    return;
  }

  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    const showUpdateNotification = () => {
      console.log('New version available');
      if (updateAvailableCallback) {
        updateAvailableCallback();
      }
    };

    wb.addEventListener('waiting', showUpdateNotification);

    wb.addEventListener('controlling', () => {
      console.log('Service worker is now controlling the page');
      window.location.reload();
    });

    wb.register()
      .then((registration) => {
        if (registration) {
          // Check for updates every minute
          setInterval(
            () => {
              registration.update();
            },
            60 * 1000,
          );

          // If a service worker is already waiting, show the notification
          if (registration.waiting) {
            showUpdateNotification();
          }
        }
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  } else {
    console.warn('Service workers are not supported in this browser');
  }
}

export function applyUpdate() {
  // In development mode, do nothing since PWA is disabled
  if (process.env.NODE_ENV === 'development') {
    console.log('PWA update not available in development mode');
    return;
  }

  // Set flag to prevent popup from showing immediately after reload
  sessionStorage.setItem('pwa-just-reloaded', 'true');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          // Fallback if no waiting service worker
          console.log('No waiting service worker, reloading page');
          window.location.reload();
        }
      })
      .catch((error) => {
        console.error('Service worker ready failed:', error);
        // Fallback reload
        window.location.reload();
      });
  } else {
    console.warn('Service workers not supported, reloading page');
    window.location.reload();
  }
}
