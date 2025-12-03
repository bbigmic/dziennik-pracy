'use client';

import { useEffect } from 'react';

export default function PushNotificationSetup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Poczekaj aż service worker będzie gotowy i dodaj obsługę powiadomień
    navigator.serviceWorker.ready.then((registration) => {
      // Service worker jest już zarejestrowany przez next-pwa
      // Dodajemy obsługę powiadomień push poprzez dodanie event listenerów w service workerze
      
      // Pobierz aktywny service worker
      if (registration.active) {
        // Event listenery dla powiadomień są już w custom-sw.js
        // Tutaj tylko logujemy że service worker jest gotowy
        console.log('Service Worker ready for push notifications');
      }
    });

    // Dodaj obsługę kliknięć w powiadomieniach (jeśli nie są już w service workerze)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        // Przekieruj do aplikacji
        window.focus();
      }
    });
  }, []);

  return null;
}

