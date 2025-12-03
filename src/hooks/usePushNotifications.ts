import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import * as React from 'react';

export function usePushNotifications() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      // Sprawdź czy service worker jest zarejestrowany
      let registrations = await navigator.serviceWorker.getRegistrations();
      
      // Jeśli service worker nie jest zarejestrowany, spróbuj go zarejestrować
      if (registrations.length === 0) {
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          try {
            console.log(`Attempting to register service worker (attempt ${retryCountRef.current}/${maxRetries})...`);
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
            });
            console.log('Service worker registered successfully');
            registrations = [registration];
            retryCountRef.current = 0; // Reset po udanej rejestracji
          } catch (regError) {
            console.error('Failed to register service worker:', regError);
            // Spróbuj ponownie po chwili
            setTimeout(() => {
              checkSubscription();
            }, 1000);
            return;
          }
        } else {
          // Przekroczono limit prób - service worker prawdopodobnie nie jest dostępny
          console.warn('Service worker registration failed after max retries');
          setSubscription(null);
          setIsSubscribed(false);
          setIsLoading(false);
          return;
        }
      }

      // Reset licznika prób jeśli service worker jest zarejestrowany
      retryCountRef.current = 0;

      // Dodaj timeout aby nie czekać w nieskończoność
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 5000)
      );

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeout
      ]) as ServiceWorkerRegistration;

      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setIsSubscribed(!!sub);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Jeśli service worker nie jest dostępny, po prostu ustaw jako nie subskrybowany
      setSubscription(null);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = useCallback(async (): Promise<{ success: boolean; error: string | null }> => {
    if (!isSupported || !session?.user?.id) {
      const errorMsg = 'Push notifications not supported or user not logged in';
      console.error(errorMsg);
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      setIsLoading(true);
      console.log('Starting subscription process...');

      // Pobierz VAPID public key
      console.log('Fetching VAPID public key...');
      const vapidResponse = await fetch('/api/push/vapid-public-key');
      if (!vapidResponse.ok) {
        const errorText = await vapidResponse.text();
        console.error('VAPID key fetch failed:', errorText);
        throw new Error('Nie można pobrać klucza VAPID. Sprawdź czy VAPID keys są skonfigurowane.');
      }
      const { publicKey } = await vapidResponse.json();
      console.log('VAPID key received');

      if (!publicKey) {
        throw new Error('VAPID public key is missing');
      }

      // Konwertuj klucz do formatu Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Sprawdź czy service worker jest zarejestrowany
      console.log('Checking service worker registration...');
      let registrations = await navigator.serviceWorker.getRegistrations();
      
      // Jeśli service worker nie jest zarejestrowany, spróbuj go zarejestrować
      if (registrations.length === 0) {
        console.log('Service worker not registered, attempting to register...');
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          console.log('Service worker registered successfully');
          registrations = [registration];
        } catch (regError) {
          console.error('Failed to register service worker:', regError);
          throw new Error('Nie można zarejestrować service workera. Upewnij się, że aplikacja działa na HTTPS.');
        }
      }

      // Zarejestruj service worker z timeoutem
      console.log('Waiting for service worker to be ready...');
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout - spróbuj odświeżyć stronę')), 10000)
      );

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeout
      ]) as ServiceWorkerRegistration;

      console.log('Service worker ready, creating subscription...');

      // Utwórz subskrypcję
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      console.log('Subscription created, sending to server...');

      // Wyślij subskrypcję do serwera
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Nie można zapisać subskrypcji');
      }

      console.log('Subscription saved successfully');
      setSubscription(sub);
      setIsSubscribed(true);
      setError(null);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error subscribing:', error);
      
      let errorMessage = 'Wystąpił błąd podczas włączania powiadomień';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Powiadomienia zostały zablokowane. Sprawdź ustawienia przeglądarki.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Twoja przeglądarka nie obsługuje powiadomień push.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, session]);

  const unsubscribe = useCallback(async (): Promise<{ success: boolean; error: string | null }> => {
    if (!subscription) {
      return { success: false, error: 'Brak aktywnej subskrypcji' };
    }

    try {
      setIsLoading(true);
      setError(null);

      // Anuluj subskrypcję w przeglądarce
      await subscription.unsubscribe();

      // Usuń z serwera
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      if (!response.ok) {
        throw new Error('Nie można usunąć subskrypcji z serwera');
      }

      setSubscription(null);
      setIsSubscribed(false);
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      const errorMsg = error.message || 'Nie udało się wyłączyć powiadomień';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    error,
  };
}

// Funkcja pomocnicza do konwersji klucza VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

