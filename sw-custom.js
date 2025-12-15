// Custom service worker dla powiadomień push
// Ten plik będzie używany jako źródło dla next-pwa (swSrc)
// next-pwa automatycznie doda workbox i precache podczas builda używając injectManifest

// UWAGA: next-pwa automatycznie wstrzyknie na początku tego pliku:
// - importScripts() dla workbox (z właściwymi URL-ami)
// - self.__WB_MANIFEST z manifestem precache
// NIE dodawaj importScripts() ręcznie!

self.skipWaiting();

// Poczekaj aż workbox będzie dostępny (next-pwa wstrzyknie go na początku)
if (typeof workbox !== 'undefined') {
  workbox.clientsClaim();
  
  // Precache manifest (next-pwa wstrzyknie self.__WB_MANIFEST)
  if (typeof self.__WB_MANIFEST !== 'undefined') {
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
  } else {
    console.warn('[SW] self.__WB_MANIFEST is not defined');
  }
} else {
  console.error('[SW] workbox is not defined - next-pwa may not have injected it correctly');
}

// Obsługa powiadomień push
self.addEventListener('push', function(event) {
  console.log('[SW] Push event received:', event);
  
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
      console.log('[SW] Notification data:', notificationData);
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
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
  console.log('[SW] Notification click:', event);
  
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
  console.log('[SW] Notification closed:', event);
});

// Runtime caching - musi być tutaj gdy używamy swSrc
// next-pwa wstrzyknie workbox, więc możemy użyć workbox API
if (typeof workbox !== 'undefined') {
  // Rejestruj route dla wszystkich żądań HTTP/HTTPS
  workbox.routing.registerRoute(
    /^https?.*/,
    new workbox.strategies.NetworkFirst({
      cacheName: 'offlineCache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
        }),
      ],
    })
  );
}

