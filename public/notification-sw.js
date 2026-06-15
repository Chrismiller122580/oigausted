// Oigagig Notification Service Worker (2027-grade Web Push)
// Register this in the client when user enables push

self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Oigagig', body: event.data ? event.data.text() : 'Nueva notificación' };
  }

  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    data: {
      url: data.url || data.link || '/',
      notificationId: data.notificationId,
      ...data.data
    },
    vibrate: [100, 50, 100],
    actions: data.actions || []
  };

  // Report that push was delivered (for tracking)
  if (data.notificationId) {
    fetch('/api/notifications/push/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId,
        event: 'delivered',
      }),
    }).catch(() => {});
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Oigagig', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const notificationId = event.notification.data?.notificationId;

  // Report click for delivery tracking
  if (notificationId) {
    fetch('/api/notifications/push/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId,
        event: 'clicked',
      }),
    }).catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
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

self.addEventListener('notificationclose', function(event) {
  // Optional: track close events
  console.log('[SW] Notification closed');
});
