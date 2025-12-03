# 🔔 Konfiguracja Powiadomień Push

Aplikacja obsługuje powiadomienia push o deadline'ach zadań dzisiaj.

## 📋 Wymagania

1. **VAPID Keys** - klucze do autentykacji powiadomień push
2. **HTTPS** - powiadomienia push wymagają HTTPS (lub localhost w development)
3. **Service Worker** - automatycznie generowany przez next-pwa

## 🔑 Generowanie VAPID Keys

### Opcja 1: Użyj web-push (zalecane)

```bash
npm install -g web-push
web-push generate-vapid-keys
```

To wygeneruje:
- **Public Key** - dodaj do `.env.local` jako `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- **Private Key** - dodaj do `.env.local` jako `VAPID_PRIVATE_KEY`
- **Subject** - dodaj do `.env.local` jako `VAPID_SUBJECT` (np. `mailto:admin@example.com`)

### Opcja 2: Użyj Node.js

```javascript
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

## ⚙️ Konfiguracja zmiennych środowiskowych

Dodaj do `.env.local`:

```env
# VAPID Keys dla powiadomień push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=twoj_public_key_tutaj
VAPID_PRIVATE_KEY=twoj_private_key_tutaj
VAPID_SUBJECT=mailto:admin@example.com

# Opcjonalnie: Secret dla cron job (jeśli używasz zewnętrznego cron)
CRON_SECRET=twoj_secret_tutaj
```

## 🕐 Konfiguracja Cron Job

Aby wysyłać powiadomienia automatycznie, skonfiguruj cron job który będzie wywoływał endpoint `/api/push/notify`.

### Przykład z Vercel Cron

Dodaj do `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/push/notify",
      "schedule": "0 9 * * *"
    }
  ]
}
```

To wyśle powiadomienia codziennie o 9:00.

### Przykład z zewnętrznym cron (np. cron-job.org)

1. Utwórz zadanie cron
2. URL: `https://twoja-domena.com/api/push/notify`
3. Metoda: `POST`
4. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
5. Schedule: Codziennie o wybranej godzinie (np. 9:00)

### Przykład z Node.js cron (lokalnie)

Możesz też uruchomić lokalny cron używając biblioteki `node-cron`:

```bash
npm install node-cron
```

Utwórz plik `scripts/send-notifications.js`:

```javascript
const cron = require('node-cron');
const https = require('https');

cron.schedule('0 9 * * *', () => {
  const url = new URL('https://twoja-domena.com/api/push/notify');
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
    },
  };

  const req = https.request(url, options, (res) => {
    console.log(`Status: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
});
```

## 🧪 Testowanie

### 1. Włącz powiadomienia w aplikacji

1. Zaloguj się do aplikacji
2. Kliknij ikonkę użytkownika
3. W sekcji "Powiadomienia push" kliknij "Włącz powiadomienia"
4. Zatwierdź prośbę o pozwolenie w przeglądarce

### 2. Utwórz zadanie z deadline'em dzisiaj

1. Dodaj nowe zadanie (todo)
2. Ustaw deadline na dzisiaj
3. Opcjonalnie ustaw czas deadline'u

### 3. Wyślij testowe powiadomienie

Możesz ręcznie wywołać endpoint:

```bash
curl -X POST https://twoja-domena.com/api/push/notify \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Lub w przeglądarce (DevTools Console):

```javascript
fetch('/api/push/notify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_CRON_SECRET'
  }
}).then(r => r.json()).then(console.log);
```

## 📱 Jak działają powiadomienia

1. **Użytkownik włącza powiadomienia** - aplikacja prosi o pozwolenie i zapisuje subscription w bazie danych
2. **Cron job wywołuje endpoint** - codziennie o określonej godzinie (np. 9:00)
3. **Endpoint sprawdza deadline'y** - znajduje wszystkie zadania z deadline'em dzisiaj, które nie są ukończone
4. **Wysyła powiadomienia** - do wszystkich subskrypcji użytkowników z deadline'ami dzisiaj
5. **Użytkownik otrzymuje powiadomienie** - kliknięcie otwiera aplikację

## 🔧 Rozwiązywanie problemów

### Powiadomienia nie działają

1. **Sprawdź VAPID keys** - upewnij się że są poprawnie skonfigurowane w `.env.local`
2. **Sprawdź HTTPS** - powiadomienia wymagają HTTPS (lub localhost)
3. **Sprawdź pozwolenie** - upewnij się że użytkownik zezwolił na powiadomienia
4. **Sprawdź service worker** - DevTools → Application → Service Workers

### Powiadomienia nie są wysyłane

1. **Sprawdź cron job** - upewnij się że cron job jest poprawnie skonfigurowany
2. **Sprawdź logi** - sprawdź logi serwera pod kątem błędów
3. **Sprawdź subskrypcje** - upewnij się że użytkownik ma aktywną subskrypcję w bazie danych

### Subskrypcja nie działa

1. **Sprawdź przeglądarkę** - nie wszystkie przeglądarki obsługują powiadomienia push
2. **Sprawdź pozwolenie** - użytkownik musi zezwolić na powiadomienia
3. **Sprawdź VAPID keys** - upewnij się że klucze są poprawne

## 📚 Więcej informacji

- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web.dev: Push Notifications](https://web.dev/push-notifications-overview/)
- [web-push documentation](https://github.com/web-push-libs/web-push)

