// Custom service worker dla powiadomień push
// Ten kod będzie dodany do service workera generowanego przez next-pwa

// Obsługa powiadomień push
self.addEventListener('push', function(event) {
  let notificationData = {
    title: 'Dziennik Pracy',
    body: 'Masz nowe powiadomienie',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'default',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/icon-96x96.png',
    tag: notificationData.tag || 'default',
    requireInteraction: notificationData.requireInteraction || false,
    data: notificationData.data || {},
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then(function(clientList) {
      // Sprawdź czy okno jest już otwarte
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otwórz nowe okno
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

