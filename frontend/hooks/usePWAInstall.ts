'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * Universal PWA installation hook.
 * - Captures native install prompts across Android Chrome and Samsung Internet.
 * - Handles early `beforeinstallprompt` events captured by layout script.
 * - Supports manual iOS Safari home screen installation instructions.
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

    // 1. Check if early layout script already captured beforeinstallprompt
    if (window.__pwaPrompt) {
      setDeferredPrompt(window.__pwaPrompt);
      setCanInstall(true);
    }

    // 2. Listen for future beforeinstallprompt event
    const promptHandler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', promptHandler);
    window.addEventListener('pwa-prompt-ready', () => {
      if (window.__pwaPrompt) {
        setDeferredPrompt(window.__pwaPrompt);
        setCanInstall(true);
      }
    });

    // 3. On iOS, manual installation is always possible
    if (isIOSDevice) {
      setCanInstall(true);
    }

    // 4. On Android devices, if beforeinstallprompt hasn't fired after 2 seconds,
    // ensure install option is still visible via fallback modal
    const androidTimer = setTimeout(() => {
      if (isAndroidDevice && !isStandalone) {
        setCanInstall(true);
      }
    }, 2000);

    const installedHandler = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
      window.__pwaPrompt = null;
      setIsInstalled(true);
      setShowInstallModal(false);
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      clearTimeout(androidTimer);
      window.removeEventListener('beforeinstallprompt', promptHandler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const promptInstall = async () => {
    const activePrompt = deferredPrompt || window.__pwaPrompt;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setCanInstall(false);
          setDeferredPrompt(null);
          window.__pwaPrompt = null;
          return;
        }
      } catch (err) {
        console.warn('Native prompt failed, showing install instructions:', err);
      }
    }

    // If native prompt unavailable or on iOS, open tailored instructions
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
