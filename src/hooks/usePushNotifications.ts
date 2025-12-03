import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import * as React from 'react';

export function usePushNotifications() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        // Service worker nie jest zarejestrowany - next-pwa może go jeszcze rejestrować
        // Spróbuj ponownie z limitem prób
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(() => {
            checkSubscription();
          }, 1000);
          return;
        } else {
          // Przekroczono limit prób - service worker prawdopodobnie nie jest dostępny
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

  const subscribe = useCallback(async () => {
    if (!isSupported || !session?.user?.id) {
      return false;
    }

    try {
      setIsLoading(true);

      // Pobierz VAPID public key
      const vapidResponse = await fetch('/api/push/vapid-public-key');
      if (!vapidResponse.ok) {
        throw new Error('Nie można pobrać klucza VAPID');
      }
      const { publicKey } = await vapidResponse.json();

      // Konwertuj klucz do formatu Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Zarejestruj service worker
      const registration = await navigator.serviceWorker.ready;

      // Utwórz subskrypcję
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Wyślij subskrypcję do serwera
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (!response.ok) {
        throw new Error('Nie można zapisać subskrypcji');
      }

      setSubscription(sub);
      setIsSubscribed(true);
      return true;
    } catch (error: any) {
      console.error('Error subscribing:', error);
      if (error.name === 'NotAllowedError') {
        alert('Powiadomienia zostały zablokowane. Sprawdź ustawienia przeglądarki.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, session]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    try {
      setIsLoading(true);

      // Anuluj subskrypcję w przeglądarce
      await subscription.unsubscribe();

      // Usuń z serwera
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setSubscription(null);
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
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

