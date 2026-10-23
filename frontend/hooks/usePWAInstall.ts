'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Robust PWA installation hook supporting Android Chrome, Samsung Internet, and iOS Safari.
 * - Always provides actionable install flow (`canInstall = true` on mobile when not standalone).
 * - Triggers native prompt when available; falls back to tailored step-by-step instructions.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode across Android/Desktop & iOS Safari
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    const ua = navigator.userAgent || '';
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isAndroidDevice = /Android/i.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    if (isStandalone) {
      setIsInstalled(true);
      setCanInstall(false);
      return;
    }

    // On mobile devices that are not yet installed, user CAN install
    if (isIOSDevice || isAndroidDevice) {
      setCanInstall(true);
    }

    const promptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', promptHandler);

    const installedHandler = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
      setShowInstallModal(false);
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', promptHandler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setCanInstall(false);
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn('Native install prompt failed, falling back to instructions:', err);
      }
    }

    // If native prompt is unavailable or deferredPrompt wasn't captured, show device instructions
    setShowInstallModal(true);
  };

  return {
    canInstall,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
    showInstallModal,
    setShowInstallModal,
    // Backwards compatibility with existing callers
    showIOSInstructions: showInstallModal,
    setShowIOSInstructions: setShowInstallModal,
  };
}
