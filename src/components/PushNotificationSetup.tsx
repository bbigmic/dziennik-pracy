'use client';

import { useEffect } from 'react';

export default function PushNotificationSetup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Sprawdź czy service worker jest gotowy i czy ma obsługę powiadomień push
    navigator.serviceWorker.ready.then(async (registration) => {
      console.log('[PushNotificationSetup] Service Worker ready');
      
      // Spróbuj zaimportować custom-sw.js do service workera
      if (registration.active) {
        try {
          // Sprawdź czy custom-sw.js jest już załadowany
          const response = await fetch('/custom-sw.js');
          if (response.ok) {
            const customCode = await response.text();
            console.log('[PushNotificationSetup] Custom SW code loaded, length:', customCode.length);
            
            // Wyślij wiadomość do service workera aby załadował custom kod
            registration.active.postMessage({
              type: 'IMPORT_CUSTOM_SW',
              url: '/custom-sw.js'
            });
          }
        } catch (error) {
          console.error('[PushNotificationSetup] Error loading custom-sw.js:', error);
        }
      }
    });

    // Dodaj obsługę wiadomości z service workera
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        window.focus();
      }
    });
  }, []);

  return null;
}

