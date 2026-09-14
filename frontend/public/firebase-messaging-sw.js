/* Firebase Messaging Service Worker for background push notifications */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Public Firebase config (safe for client-side inclusion)
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || 'MOCK_API_KEY',
  projectId: self.FIREBASE_PROJECT_ID || 'definam-pwa',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: self.FIREBASE_APP_ID || '1:1234567890:web:abcdef',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'Recall Reminder';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'You have pending learning tasks.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL('/student/review', self.location.origin).href;

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
