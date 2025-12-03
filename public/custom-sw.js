// Custom service worker dla powiadomień push
// Ten kod będzie dodany do service workera generowanego przez next-pwa
// Uwaga: Ten plik jest w precache, ale może nie być automatycznie dołączany
// Jeśli powiadomienia nie działają, sprawdź czy ten kod jest w aktywnym service workerze

console.log('[custom-sw.js] Loading push notification handlers');

// Obsługa powiadomień push
self.addEventListener('push', function(event) {
  console.log('[custom-sw.js] Push event received:', event);
  
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
      console.log('[custom-sw.js] Notification data:', notificationData);
    } catch (e) {
      console.error('[custom-sw.js] Error parsing push data:', e);
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
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  });

  event.waitUntil(promiseChain);
});

// Obsługa kliknięć w powiadomieniach
self.addEventListener('notificationclick', function(event) {
  console.log('[custom-sw.js] Notification click:', event);
  
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
        if (client.url.includes(urlToOpen) && 'focus' in client) {
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

// Obsługa zamknięcia powiadomienia
self.addEventListener('notificationclose', function(event) {
  console.log('[custom-sw.js] Notification closed:', event);
});

