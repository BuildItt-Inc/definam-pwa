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

export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  const msg = getFirebaseMessaging();
  if (!msg) return null;

  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || DEFAULT_VAPID_KEY;
    let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      } catch {
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (e) {
          console.warn('SW register notice:', e);
        }
      }
      try {
        const readyReg = await navigator.serviceWorker.ready;
        if (readyReg) {
          serviceWorkerRegistration = readyReg;
        }
      } catch (e) {
        console.warn('SW ready notice:', e);
      }
    }

    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration,
    });
    if (token) {
      setStoredFcmToken(token);
      return token;
    }
  } catch (err) {
    console.error('Failed to get FCM token:', err);
  }
  return null;
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
