'use client';

import { useEffect } from 'react';

export default function PushNotificationSetup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Funkcja do rejestracji service workera
    const registerServiceWorker = async () => {
      try {
        // Sprawdź czy service worker jest już zarejestrowany
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length === 0) {
          console.log('[PushNotificationSetup] Service worker not registered, registering...');
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          console.log('[PushNotificationSetup] Service worker registered:', registration);
        } else {
          console.log('[PushNotificationSetup] Service worker already registered');
        }

        // Poczekaj aż service worker będzie gotowy
        const registration = await navigator.serviceWorker.ready;
      console.log('[PushNotificationSetup] Service Worker ready');
      
        // Sprawdź status service workera
        if (registration.active) {
          console.log('[PushNotificationSetup] Service worker is active:', registration.active.state);
        } else if (registration.installing) {
          console.log('[PushNotificationSetup] Service worker is installing...');
        } else if (registration.waiting) {
          console.log('[PushNotificationSetup] Service worker is waiting...');
        }
        
        // Spróbuj zaimportować custom-sw.js do service workera (opcjonalne)
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
      } catch (error: any) {
        console.error('[PushNotificationSetup] Error registering service worker:', error);
        
        // Dodatkowe informacje diagnostyczne
        if (error.message) {
          console.error('[PushNotificationSetup] Error message:', error.message);
        }
        if (error.stack) {
          console.error('[PushNotificationSetup] Error stack:', error.stack);
        }
        
        // Sprawdź czy plik sw.js jest dostępny
        try {
          const swResponse = await fetch('/sw.js');
          console.log('[PushNotificationSetup] sw.js response status:', swResponse.status);
          console.log('[PushNotificationSetup] sw.js content-type:', swResponse.headers.get('content-type'));
          
          if (swResponse.ok) {
            const swText = await swResponse.text();
            console.log('[PushNotificationSetup] sw.js length:', swText.length);
            console.log('[PushNotificationSetup] sw.js first 500 chars:', swText.substring(0, 500));
            
            // Sprawdź czy zawiera workbox
            if (swText.includes('workbox')) {
              console.log('[PushNotificationSetup] ✅ sw.js contains workbox');
            } else {
              console.warn('[PushNotificationSetup] ⚠️ sw.js does NOT contain workbox');
            }
            
            // Sprawdź czy zawiera importScripts
            if (swText.includes('importScripts')) {
              console.log('[PushNotificationSetup] ✅ sw.js contains importScripts');
            } else {
              console.warn('[PushNotificationSetup] ⚠️ sw.js does NOT contain importScripts');
            }
          } else {
            console.error('[PushNotificationSetup] ❌ sw.js is not accessible (status:', swResponse.status, ')');
          }
        } catch (fetchError) {
          console.error('[PushNotificationSetup] Error fetching sw.js:', fetchError);
        }
      }
    };

    // Zarejestruj service workera
    registerServiceWorker();

    // Dodaj obsługę wiadomości z service workera
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        window.focus();
      }
    });
  }, []);

  return null;
}

