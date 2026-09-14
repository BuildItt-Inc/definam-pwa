import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'MOCK_API_KEY',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'definam-pwa',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
};

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
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(msg, vapidKey ? { vapidKey } : undefined);
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
