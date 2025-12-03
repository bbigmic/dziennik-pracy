# 🔧 Rozwiązywanie problemów z powiadomieniami push

## Problem: Nie otrzymuję powiadomień push na telefonie

### Krok 1: Sprawdź czy subskrypcja istnieje w bazie danych

1. Otwórz `npx prisma studio`
2. Przejdź do tabeli `PushSubscription`
3. Sprawdź czy jest subskrypcja z Twoim `userId`
4. Sprawdź czy `endpoint`, `p256dh` i `auth` są wypełnione

### Krok 2: Sprawdź logi z ostatniego wywołania crona

W Vercel Dashboard → Logs → Filtruj po `/api/push/notify`

Szukaj:
- `Found X tasks with deadline today` - czy znalazł Twoje zadania?
- `User has X push subscriptions` - czy użytkownik ma subskrypcje?
- `Notification sent successfully` - czy powiadomienia zostały wysłane?
- `Error sending notification` - czy były błędy?

### Krok 3: Sprawdź czy VAPID keys są poprawne

1. Vercel Dashboard → Settings → Environment Variables
2. Sprawdź czy są ustawione:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`

**Ważne:** Jeśli zmieniłeś VAPID keys, musisz:
1. Usunąć stare subskrypcje z bazy danych
2. Wyłączyć i ponownie włączyć powiadomienia w aplikacji

### Krok 4: Sprawdź ustawienia powiadomień na telefonie

**Android:**
1. Ustawienia → Aplikacje → Dziennik Pracy
2. Sprawdź czy powiadomienia są włączone
3. Sprawdź czy aplikacja ma uprawnienia do powiadomień

**iOS:**
1. Ustawienia → Powiadomienia → Dziennik Pracy
2. Sprawdź czy powiadomienia są włączone
3. Sprawdź czy aplikacja ma uprawnienia do powiadomień

### Krok 5: Sprawdź czy PWA jest poprawnie zainstalowana

1. Otwórz aplikację w przeglądarce na telefonie
2. Sprawdź czy PWA jest zainstalowana (ikonka na ekranie głównym)
3. Otwórz aplikację przez ikonkę PWA (nie przez przeglądarkę)

**Ważne:** Powiadomienia push działają tylko w zainstalowanej PWA, nie w przeglądarce!

### Krok 6: Sprawdź service worker na telefonie

1. Otwórz aplikację PWA na telefonie
2. W Chrome: Menu → Więcej narzędzi → Narzędzia deweloperskie (jeśli dostępne)
3. Sprawdź czy service worker jest aktywny

**Alternatywnie:** Sprawdź w DevTools na komputerze (Remote Debugging):
- Chrome: `chrome://inspect` → Devices
- Połącz telefon i sprawdź service worker

### Krok 7: Test ręczny

Wywołaj endpoint ręcznie:

```bash
curl -X POST https://dziennik-pracy.vercel.app/api/push/notify \
  -H "x-vercel-cron: 1"
```

Sprawdź logi czy powiadomienia zostały wysłane.

### Krok 8: Sprawdź czy zadanie ma deadline dzisiaj

1. Sprawdź w bazie danych czy zadanie ma `deadline = dzisiaj` (format: YYYY-MM-DD)
2. Sprawdź czy zadanie nie jest ukończone (`completed = false`)

### Krok 9: Wyłącz i ponownie włącz powiadomienia

1. Otwórz aplikację
2. Profil → Powiadomienia push
3. Wyłącz powiadomienia
4. Odśwież stronę
5. Włącz powiadomienia ponownie
6. Zatwierdź prośbę o pozwolenie

### Krok 10: Sprawdź czy endpoint push service jest dostępny

Subskrypcje push używają endpointów od:
- Chrome/Android: `fcm.googleapis.com` lub `updates.push.services.mozilla.com`
- Firefox: `updates.push.services.mozilla.com`
- Safari/iOS: Wymaga Apple Push Notification Service (APNs) - nie obsługiwane przez Web Push API

Sprawdź czy endpoint w subskrypcji jest dostępny (nie zablokowany przez firewall).

## Częste problemy:

### Problem: "User has 0 push subscriptions"
**Rozwiązanie:** Wyłącz i ponownie włącz powiadomienia w aplikacji

### Problem: "Error sending notification: 401 Unauthorized"
**Rozwiązanie:** 
- Sprawdź czy VAPID keys są poprawne
- Usuń starą subskrypcję i utwórz nową

### Problem: "Error sending notification: 410 Gone"
**Rozwiązanie:** Subskrypcja wygasła - usuń ją i utwórz nową

### Problem: Powiadomienia działają na komputerze, ale nie na telefonie
**Rozwiązanie:**
- Sprawdź czy PWA jest zainstalowana na telefonie
- Sprawdź ustawienia powiadomień na telefonie
- Sprawdź czy aplikacja ma uprawnienia do powiadomień

### Problem: Service worker nie jest zarejestrowany
**Rozwiązanie:**
- Odśwież stronę
- Sprawdź czy aplikacja działa na HTTPS
- Sprawdź czy next-pwa jest poprawnie skonfigurowane

## Testowanie:

1. **Utwórz zadanie z deadline dzisiaj**
2. **Wywołaj endpoint ręcznie** (lub poczekaj na cron)
3. **Sprawdź logi** w Vercel Dashboard
4. **Sprawdź czy powiadomienie przyszło** na telefonie

Jeśli nadal nie działa, sprawdź logi i daj znać co się pojawia!

