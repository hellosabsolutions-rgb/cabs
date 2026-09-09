// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBVuaUye79dCwCzqUqZ1H81D0geIN63MKc",
  authDomain: "opsiva-e1ee5.firebaseapp.com",
  projectId: "opsiva-e1ee5",
  storageBucket: "opsiva-e1ee5.firebasestorage.app",
  messagingSenderId: "546992458715",
  appId: "1:546992458715:web:0ad1761fb9a439236ff5fe",
  measurementId: "G-WYW0TG0FY9"
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 [SW] Received background push message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'FleetOS Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || payload.data?.message || 'New fleet update received.',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: payload.data?.category || 'fleetos-push',
    data: {
      url: payload.data?.link || payload.data?.click_action || '/notifications',
      ...payload.data
    },
    requireInteraction: payload.data?.priority === 'critical'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click: focus app tab or open destination URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL or app
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // If no window is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
