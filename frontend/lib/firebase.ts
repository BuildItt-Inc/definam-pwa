import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB7WiyEMDutwpVTC2SlvBZ1eO_IBAykC-A',
  authDomain: 'recall-sr.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'recall-sr',
  storageBucket: 'recall-sr.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '687015329695',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:687015329695:web:17db4b9d91fcb4fdc207aa',
};

const DEFAULT_VAPID_KEY =
  'BPrUUZ-krMP5PzHIbClw3MA2_SG5-a_asn9FtUjTd2enKejZc1GgzY-KdxqVXqyIAg-xTGTpMBLD8aY24pKxK80';

const FCM_TOKEN_STORAGE_KEY = 'definam_fcm_token';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!app && !getApps().length) {
    app = initializeApp(firebaseConfig);
  } else if (!app) {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  const appInstance = getFirebaseApp();
  if (!appInstance) return null;

  if (!messaging && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(appInstance);
    } catch (err) {
      console.warn('Firebase messaging initialization failed:', err);
    }
  }
  return messaging;
}

export function getStoredFcmToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
}

export function setStoredFcmToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
}

export function clearStoredFcmToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
}

async function waitForActiveServiceWorker(
  reg: ServiceWorkerRegistration,
  timeoutMs: number = 8000,
): Promise<ServiceWorkerRegistration | null> {
  if (reg.active) return reg;

  const worker = reg.installing || reg.waiting;
  if (!worker) return null;

  const activated = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      worker.removeEventListener('statechange', onStateChange);
      resolve(Boolean(reg.active));
    }, timeoutMs);

    const onStateChange = () => {
      if (reg.active || worker.state === 'activated') {
        clearTimeout(timer);
        worker.removeEventListener('statechange', onStateChange);
        resolve(true);
      } else if (worker.state === 'redundant') {
        clearTimeout(timer);
        worker.removeEventListener('statechange', onStateChange);
        resolve(Boolean(reg.active));
      }
    };

    worker.addEventListener('statechange', onStateChange);
  });

  return activated && reg.active ? reg : null;
}

const FCM_FALLBACK_SCOPE = '/firebase-cloud-messaging-push-scope';

async function resolveMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  // 1. Prefer existing active PWA registration on '/' (sw.js includes firebase-messaging-sw.js)
  const existingRoot = await navigator.serviceWorker.getRegistration('/');
  if (existingRoot?.active) {
    return existingRoot;
  }

  if (existingRoot && (existingRoot.installing || existingRoot.waiting)) {
    const readyRoot = await waitForActiveServiceWorker(existingRoot, 6000);
    if (readyRoot?.active) return readyRoot;
  } else if (!existingRoot) {
    try {
      const registeredRoot = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const readyRoot = await waitForActiveServiceWorker(registeredRoot, 6000);
      if (readyRoot?.active) return readyRoot;
    } catch {
      // Ignore /sw.js errors (e.g. dev mode) and fall through to lightweight FCM worker
    }
  }

  // 2. Fallback: register dedicated lightweight FCM worker under an isolated push scope.
  // Push subscriptions are bound 1:1 to a single registration, so an isolated scope avoids
  // any conflict or duplicate push delivery with /sw.js.
  let fcmReg = await navigator.serviceWorker.getRegistration(FCM_FALLBACK_SCOPE);
  if (!fcmReg || !fcmReg.active) {
    fcmReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: FCM_FALLBACK_SCOPE,
    });
    const readyFcm = await waitForActiveServiceWorker(fcmReg, 6000);
    if (readyFcm?.active) return readyFcm;
  }

  if (fcmReg?.active) return fcmReg;

  throw new Error('Could not activate notification service worker. Refresh the page and try again.');
}

export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser.');
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications require a supported browser or Home Screen app.');
  }

  // Must be called directly within user gesture (critical for iOS)
  const permission = await Notification.requestPermission();
  if (permission === 'denied') {
    throw new Error('Notifications are blocked by your browser. Enable permissions in site settings.');
  }
  if (permission !== 'granted') {
    return null;
  }

  const msg = getFirebaseMessaging();
  if (!msg) {
    throw new Error('Could not initialize push notifications on this device.');
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || DEFAULT_VAPID_KEY;
  const serviceWorkerRegistration = await resolveMessagingServiceWorker();

  try {
    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration,
    });

    if (token) {
      setStoredFcmToken(token);
      return token;
    }
    throw new Error('Push service did not return a device token. Please try again.');
  } catch (err) {
    console.error('Failed to get FCM token:', err);
    const rawMsg = err instanceof Error ? err.message : '';
    if (/push service error|AbortError/i.test(rawMsg)) {
      throw new Error(
        'Push service blocked by browser or privacy shield. Try disabling ad/tracker blocking for this site.',
      );
    }
    throw err instanceof Error ? err : new Error('Could not register device for notifications.');
  }
}

export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): () => void {
  const msg = getFirebaseMessaging();
  if (!msg) return () => {};

  return onMessage(msg, (payload) => {
    const title = payload.notification?.title || payload.data?.title;
    const body = payload.notification?.body || payload.data?.body;
    const data = (payload.data as Record<string, string>) || {};
    callback({ title, body, data });
  });
}

/**
 * Fires a local test notification directly via the Service Worker.
 * Ensures the device hardware/OS notification pipeline triggers immediately.
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg =
        (await navigator.serviceWorker.getRegistration('/')) ||
        (await navigator.serviceWorker.getRegistration(FCM_FALLBACK_SCOPE));
      if (reg?.active && 'showNotification' in reg) {
        await reg.showNotification(title, {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          ...options,
        });
        return true;
      }
    }
  } catch (e) {
    console.warn('Local service worker notification failed:', e);
  }

  // Fallback to constructor on platforms that permit it
  try {
    new Notification(title, {
      icon: '/icons/icon-192.png',
      ...options,
    });
    return true;
  } catch (_) {
    return false;
  }
}
