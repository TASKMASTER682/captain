'use client';

import { useEffect } from 'react';

/**
 * Mounted once in the root layout. Registers /sw.js and checks for worker
 * updates on every page load.
 *
 * Registers in development too — Chrome requires an active service worker
 * before it will fire `beforeinstallprompt`, so without this the install
 * button can never appear while running `next dev`. In dev the worker is
 * switched to a pure passthrough mode via postMessage, so HMR, Fast Refresh
 * and un-hashed chunks are never served from cache.
 *
 * Note: a waiting service worker is NOT force-activated. A forced reload while
 * a student is mid-exam would be far worse than briefly running the previous
 * (identical-behaving) worker; browsers promote the waiting worker on the next
 * cold start anyway.
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Prevent double-registration (React Strict Mode runs effects twice)
    if ((window as any).__sw_registered) return;
    (window as any).__sw_registered = true;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          if (process.env.NODE_ENV !== 'production') {
            // Dev mode: keep the worker alive for installability but make it
            // hands-off. Re-sent whenever the controller takes over.
            let notifying = false;
            const notify = () => {
              if (notifying) return; // prevent feedback loop
              notifying = true;
              registration.active?.postMessage({ type: 'DEV_PASSTHROUGH' });
              setTimeout(() => { notifying = false; }, 1000);
            };
            notify();
            // Only listen for controllerchange once — avoid infinite loop
            navigator.serviceWorker.addEventListener('controllerchange', notify, { once: true });
          }
        })
        .catch((error) => {
          console.error('[pwa] service worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
