/* Firebase Messaging Service Worker for background push notifications */
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

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);

      const title = payload.notification?.title || payload.data?.title || 'Recall Reminder';
      const options = {
        body: payload.notification?.body || payload.data?.body || 'You have pending learning tasks.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: payload.data?.type || 'recall-notification',
        data: payload.data || {},
      };

      self.registration.showNotification(title, options);
    });
  }
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase SDK init notice:', e);
}

// Fallback native push event listener (vital for iOS WebKit Web Push compliance)
self.addEventListener('push', (event) => {
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
      tag: rawData.data?.type || 'recall-notification',
      data: rawData.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    try {
      const text = event.data.text();
      if (text) {
        event.waitUntil(
          self.registration.showNotification('Recall', {
            body: text,
            icon: '/icons/icon-192.png',
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
