import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PwaContext = createContext(null);

/**
 * Global PWA Context Provider.
 *
 * Manages:
 * 1. Service Worker lifecycle (registration, update prompt, reload) via `virtual:pwa-register/react`.
 * 2. App installation state (Chromium `beforeinstallprompt`, `appinstalled`, iOS standalone detection).
 * 3. iOS manual installation guide modal visibility.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function PwaProvider({ children }) {
  // Service Worker update state
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // Optional periodic update check every hour
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('GymPilot PWA ServiceWorker registration error:', error);
    },
  });

  // Installation prompt & platform state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  // Triple-check installed state: display-mode standalone, iOS standalone, appinstalled
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneDisplay = window.matchMedia?.('(display-mode: standalone)').matches;
    const isIosStandalone = window.navigator?.standalone === true;
    return Boolean(isStandaloneDisplay || isIosStandalone);
  });

  // iOS detection (iPhone, iPad, iPod, or iPadOS desktop emulation)
  const isIos = useMemo(() => {
    if (typeof window === 'undefined' || !window.navigator) return false;
    const ua = window.navigator.userAgent || '';
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua);
    const isMacTouch = /Macintosh/.test(ua) && (window.navigator.maxTouchPoints || 0) > 1;
    return Boolean(isAppleDevice || isMacTouch);
  }, []);

  // Listen for beforeinstallprompt and appinstalled events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (event) => {
      // Prevent automatic mini-infobar on mobile Chrome
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery?.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery?.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  // Installable condition: not already installed, not dismissed, and either has prompt or is uninstalled iOS
  const isInstallable = useMemo(() => {
    if (isInstalled || isDismissed) return false;
    return Boolean(deferredPrompt || isIos);
  }, [isInstalled, isDismissed, deferredPrompt, isIos]);

  /**
   * Prompts user to install the application.
   */
  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    }
  }, [deferredPrompt, isIos]);

  /**
   * Dismisses the install CTA for the current session.
   */
  const dismissInstall = useCallback(() => {
    setIsDismissed(true);
  }, []);

  /**
   * Applies the waiting service worker and reloads the page.
   */
  const updateApp = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  /**
   * Dismisses the update banner without triggering a reload.
   */
  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  const value = useMemo(
    () => ({
      needRefresh,
      updateApp,
      dismissUpdate,
      isInstallable,
      isInstalled,
      isIos,
      installApp,
      dismissInstall,
      showIosModal,
      setShowIosModal,
    }),
    [
      needRefresh,
      updateApp,
      dismissUpdate,
      isInstallable,
      isInstalled,
      isIos,
      installApp,
      dismissInstall,
      showIosModal,
      setShowIosModal,
    ]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export default PwaProvider;

