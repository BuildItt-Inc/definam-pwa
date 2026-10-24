/* Firebase Messaging Service Worker for background push notifications */

// Notification deduplication cache (prevents duplicate alerts within 10 seconds)
const seenNotificationKeys = new Map();

function safeShowNotification(title, options) {
  const dedupKey = (options.tag || title) + '::' + (options.body || '');
  const now = Date.now();

  // Prune entries older than 30 seconds
  for (const [key, time] of seenNotificationKeys.entries()) {
    if (now - time > 30000) {
      seenNotificationKeys.delete(key);
    }
  }

  // Deduplicate: if this exact notification was processed recently, suppress it
  if (seenNotificationKeys.has(dedupKey) && now - seenNotificationKeys.get(dedupKey) < 10000) {
    console.log('[firebase-messaging-sw.js] Duplicate notification suppressed:', dedupKey);
    return Promise.resolve();
  }

  seenNotificationKeys.set(dedupKey, now);
  return self.registration.showNotification(title, options);
}

let firebaseMessagingActive = false;

try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  // Public Firebase config (safe for client-side inclusion)
  const firebaseConfig = {
    apiKey: self.FIREBASE_API_KEY || 'AIzaSyB7WiyEMDutwpVTC2SlvBZ1eO_IBAykC-A',
    authDomain: 'recall-sr.firebaseapp.com',
    projectId: self.FIREBASE_PROJECT_ID || 'recall-sr',
    storageBucket: 'recall-sr.firebasestorage.app',
    messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '687015329695',
    appId: self.FIREBASE_APP_ID || '1:687015329695:web:17db4b9d91fcb4fdc207aa',
  };

  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  if (typeof firebase !== 'undefined' && typeof firebase.messaging === 'function') {
    const messaging = firebase.messaging();
    firebaseMessagingActive = true;

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);

      const title = payload.notification?.title || payload.data?.title || 'Recall Reminder';
      const options = {
        body: payload.notification?.body || payload.data?.body || 'You have pending learning tasks.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: payload.data?.type || payload.data?.tag || 'recall-notification',
        data: payload.data || {},
      };

      safeShowNotification(title, options);
    });
  }
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase SDK init notice:', e);
}

// Fallback native push event listener (ONLY runs if Firebase messaging failed to initialize)
self.addEventListener('push', (event) => {
  // If Firebase Messaging SDK is already handling background push, skip to prevent double notifications
  if (firebaseMessagingActive) {
    return;
  }

  if (!event.data) return;

  try {
    const rawData = event.data.json();
    const title =
      rawData.notification?.title ||
      rawData.data?.title ||
      'Recall Reminder';
    const body =
      rawData.notification?.body ||
      rawData.data?.body ||
      'You have pending learning tasks.';

    const options = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: rawData.data?.type || rawData.data?.tag || 'recall-notification',
      data: rawData.data || {},
    };

    event.waitUntil(safeShowNotification(title, options));
  } catch (err) {
    try {
      const text = event.data.text();
      if (text) {
        event.waitUntil(
          safeShowNotification('Recall', {
            body: text,
            icon: '/icons/icon-192.png',
            tag: 'recall-plain',
          })
        );
      }
    } catch (_) {}
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = event.notification.data?.link || '/student/review';
  const urlToOpen = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
