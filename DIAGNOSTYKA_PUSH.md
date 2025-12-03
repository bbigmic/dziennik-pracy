# 🔍 Diagnostyka problemu z powiadomieniami push

## Problem
Użytkownik nie otrzymuje powiadomień push na telefonie mimo że:
- Włączył powiadomienia przez PWA
- Subskrypcja istnieje w bazie danych
- Endpoint `/api/push/notify` działa (widoczne w logach Vercel)
- Powiadomienia są wysyłane (widoczne w logach)

## Możliwe przyczyny

### 1. Service Worker nie ma obsługi powiadomień push
**Problem:** next-pwa generuje service worker automatycznie, ale `custom-sw.js` może nie być dołączany.

**Rozwiązanie:** 
- Sprawdź w DevTools (Chrome: `chrome://inspect`) czy service worker ma event listenery `push` i `notificationclick`
- Jeśli nie ma, musimy dodać kod bezpośrednio w service workerze

### 2. Subskrypcja została utworzona z innymi VAPID keys
**Problem:** Jeśli zmieniłeś VAPID keys, stare subskrypcje nie będą działać.

**Rozwiązanie:**
- Usuń stare subskrypcje z bazy danych
- Wyłącz i ponownie włącz powiadomienia w aplikacji

### 3. Powiadomienia są blokowane przez system telefonu
**Problem:** Android/iOS może blokować powiadomienia.

**Rozwiązanie:**
- Sprawdź ustawienia powiadomień dla aplikacji w systemie telefonu
- Upewnij się, że aplikacja ma uprawnienia do powiadomień

### 4. PWA nie jest poprawnie zainstalowana
**Problem:** Powiadomienia push działają tylko w zainstalowanej PWA, nie w przeglądarce.

**Rozwiązanie:**
- Otwórz aplikację przez ikonkę PWA na ekranie głównym (nie przez przeglądarkę)
- Sprawdź czy PWA jest zainstalowana

### 5. Service worker nie jest aktywny
**Problem:** Service worker może być nieaktywny lub nie zarejestrowany.

**Rozwiązanie:**
- Odśwież stronę
- Sprawdź w DevTools czy service worker jest aktywny
- Sprawdź czy aplikacja działa na HTTPS

## Kroki diagnostyczne

### Krok 1: Sprawdź service worker na telefonie
1. Otwórz aplikację PWA na telefonie
2. W Chrome na komputerze: `chrome://inspect` → Devices
3. Połącz telefon i sprawdź service worker
4. Sprawdź czy są event listenery `push` i `notificationclick`

### Krok 2: Sprawdź subskrypcję w bazie danych
```sql
SELECT * FROM "PushSubscription" WHERE "userId" = 'twoj-user-id';
```
Sprawdź czy:
- `endpoint` jest wypełniony
- `p256dh` jest wypełniony
- `auth` jest wypełniony

### Krok 3: Sprawdź logi z ostatniego wywołania crona
W Vercel Dashboard → Logs → Filtruj po `/api/push/notify`

Szukaj:
- `Found X tasks with deadline today`
- `User has X push subscriptions`
- `Notification sent successfully`
- `Error sending notification`

### Krok 4: Test ręczny
Wywołaj endpoint ręcznie:
```bash
curl -X GET https://dziennik-pracy.vercel.app/api/push/notify \
  -H "user-agent: vercel-cron/1.0"
```

### Krok 5: Sprawdź VAPID keys
1. Vercel Dashboard → Settings → Environment Variables
2. Sprawdź czy są ustawione:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

### Krok 6: Sprawdź czy zadanie ma deadline dzisiaj
1. Sprawdź w bazie danych czy zadanie ma `deadline = dzisiaj` (format: YYYY-MM-DD)
2. Sprawdź czy zadanie nie jest ukończone (`completed = false`)

## Rozwiązanie: Dodanie obsługi powiadomień push do service workera

Jeśli service worker nie ma obsługi powiadomień push, musimy dodać kod bezpośrednio w service workerze.

### Opcja 1: Użyj `swSrc` w next-pwa (zalecane)
Stwórz własny service worker który importuje workbox i dodaje obsługę powiadomień push.

### Opcja 2: Dodaj kod przez `importScripts`
Dodaj `importScripts('/custom-sw.js')` w service workerze generowanym przez next-pwa.

### Opcja 3: Dodaj kod bezpośrednio w service workerze
Dodaj event listenery `push` i `notificationclick` bezpośrednio w service workerze.

## Testowanie

1. **Utwórz zadanie z deadline dzisiaj**
2. **Wywołaj endpoint ręcznie** (lub poczekaj na cron)
3. **Sprawdź logi** w Vercel Dashboard
4. **Sprawdź czy powiadomienie przyszło** na telefonie

Jeśli nadal nie działa, sprawdź logi i daj znać co się pojawia!

