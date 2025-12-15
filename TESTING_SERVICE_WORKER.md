# Testowanie Service Workera - Dziennik Pracy

Ten dokument opisuje jak sprawdzić czy service worker działa poprawnie zarówno lokalnie jak i na produkcji.

## ⚠️ Ważne informacje

- Service worker jest **wyłączony w trybie development** (`disable: process.env.NODE_ENV === "development"` w `next.config.ts`)
- Service worker wymaga **HTTPS** (poza localhost)
- Service worker jest automatycznie rejestrowany przez `next-pwa` podczas builda
- Plik service workera jest generowany jako `/sw.js` w folderze `public/`

## 🧪 Testowanie lokalnie

### Krok 1: Zbuduj aplikację w trybie produkcyjnym

```bash
npm run build
npm start
```

**Uwaga:** Service worker nie działa w `npm run dev` - musisz użyć builda produkcyjnego.

### Krok 2: Otwórz aplikację w przeglądarce

1. Otwórz `http://localhost:3000` (lub inny port jeśli zmieniony)
2. Otwórz DevTools (F12 lub Cmd+Option+I)

### Krok 3: Sprawdź Service Worker w DevTools

#### Chrome/Edge DevTools:

1. **Zakładka "Application" / "Aplikacja":**
   - Po lewej stronie znajdź sekcję **"Service Workers"**
   - Powinieneś zobaczyć zarejestrowany service worker z statusem:
     - ✅ **"activated and is running"** - działa poprawnie
     - ⏳ **"waiting to activate"** - czeka na aktywację (odśwież stronę)
     - ❌ **"redundant"** - został zastąpiony nową wersją

2. **Sprawdź szczegóły:**
   - Kliknij na service worker aby zobaczyć szczegóły
   - Sprawdź URL: powinien być `/sw.js`
   - Sprawdź Scope: powinien być `/`
   - Sprawdź Source: powinien wskazywać na wygenerowany plik

3. **Zakładka "Console" / "Konsola":**
   - Sprawdź logi z service workera (powinny zaczynać się od `[SW]`)
   - Sprawdź czy nie ma błędów

#### Firefox DevTools:

1. **Zakładka "Application" / "Aplikacja":**
   - Po lewej stronie znajdź **"Service Workers"**
   - Sprawdź status i szczegóły podobnie jak w Chrome

### Krok 4: Sprawdź plik service workera

1. W DevTools przejdź do zakładki **"Network" / "Sieć"**
2. Odśwież stronę (Cmd+R / Ctrl+R)
3. Wyszukaj `sw.js` w liście żądań
4. Sprawdź:
   - ✅ Status: `200 OK`
   - ✅ Type: `serviceworker` lub `script`
   - ✅ Response: powinien zawierać kod service workera

### Krok 5: Sprawdź w konsoli przeglądarki

Otwórz konsolę przeglądarki i wykonaj:

```javascript
// Sprawdź czy service worker jest zarejestrowany
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Zarejestrowane service workery:', registrations);
  if (registrations.length > 0) {
    console.log('Service Worker URL:', registrations[0].active?.scriptURL);
    console.log('Service Worker State:', registrations[0].active?.state);
  } else {
    console.warn('Brak zarejestrowanych service workerów!');
  }
});

// Sprawdź czy service worker jest gotowy
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker ready:', registration);
  console.log('Active SW:', registration.active);
  console.log('Waiting SW:', registration.waiting);
  console.log('Installing SW:', registration.installing);
});
```

### Krok 6: Sprawdź logi z service workera

W konsoli powinieneś zobaczyć logi z `PushNotificationSetup`:
- `[PushNotificationSetup] Service Worker ready`
- `[PushNotificationSetup] Custom SW code loaded`

## 🌐 Testowanie na produkcji

### Krok 1: Weryfikacja przed wdrożeniem

#### 1.1 Sprawdź build lokalnie

```bash
npm run build
npm start
```

Upewnij się, że:
- ✅ Build zakończył się bez błędów
- ✅ Plik `public/sw.js` został wygenerowany
- ✅ Service worker działa lokalnie (patrz sekcja powyżej)

#### 1.2 Sprawdź plik sw.js

Po buildzie sprawdź czy plik istnieje:

```bash
ls -la public/sw.js
```

Plik powinien istnieć i mieć rozmiar > 0.

#### 1.3 Sprawdź zawartość pliku

```bash
head -20 public/sw.js
```

Powinieneś zobaczyć:
- Import workbox (`importScripts(...)`)
- Kod z `sw-custom.js`
- Precache manifest

### Krok 2: Weryfikacja na produkcji

#### 2.1 Sprawdź dostępność pliku

Otwórz w przeglądarce:
```
https://twoja-domena.com/sw.js
```

Powinieneś zobaczyć kod JavaScript service workera (nie błąd 404).

#### 2.2 Sprawdź w DevTools (produkcja)

1. Otwórz aplikację na produkcji
2. Otwórz DevTools (F12)
3. Przejdź do zakładki **"Application" → "Service Workers"**
4. Sprawdź status (powinien być "activated and is running")

#### 2.3 Sprawdź w konsoli (produkcja)

Wykonaj te same komendy co lokalnie:

```javascript
// Sprawdź rejestrację
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SW registrations:', regs);
});

// Sprawdź gotowość
navigator.serviceWorker.ready.then(reg => {
  console.log('SW ready:', reg);
});
```

### Krok 3: Testowanie powiadomień push

#### 3.1 Sprawdź subskrypcję push

W konsoli przeglądarki:

```javascript
navigator.serviceWorker.ready.then(async (registration) => {
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    console.log('✅ Subskrypcja push aktywna:', subscription);
  } else {
    console.log('❌ Brak subskrypcji push');
  }
});
```

#### 3.2 Wyślij testowe powiadomienie

Użyj API aplikacji lub narzędzi deweloperskich:

```javascript
// Przykład: wyślij powiadomienie przez API
fetch('/api/push/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test',
    body: 'To jest testowe powiadomienie',
  }),
});
```

### Krok 4: Sprawdź cache

#### 4.1 Sprawdź precache

W DevTools → Application → Cache Storage:
- Powinieneś zobaczyć cache z prefiksem `workbox-precache-`
- Sprawdź czy zawiera pliki aplikacji

#### 4.2 Sprawdź runtime cache

- Powinieneś zobaczyć cache `offlineCache` (zdefiniowany w `sw-custom.js`)

## 🔍 Narzędzia do testowania

### Szybki test w konsoli przeglądarki

Najszybszy sposób na sprawdzenie statusu service workera:

1. **Otwórz konsolę przeglądarki** (F12 → Console)
2. **Wklej i wykonaj skrypt testowy:**

```javascript
// Skopiuj zawartość pliku public/test-sw.js lub:
fetch('/test-sw.js').then(r => r.text()).then(eval);
```

Lub otwórz w przeglądarce:
```
https://twoja-domena.com/test-sw.js
```

Skrypt automatycznie sprawdzi:
- ✅ Czy przeglądarka obsługuje service workery
- ✅ Liczbę zarejestrowanych service workerów
- ✅ Status każdego service workera (aktywny/czekający/instalujący)
- ✅ URL i scope service workera
- ✅ Subskrypcję push (jeśli istnieje)
- ✅ Dostępność pliku sw.js
- ✅ Cache storage

### Lighthouse (Chrome DevTools)

1. Otwórz DevTools → zakładka **"Lighthouse"**
2. Wybierz **"Progressive Web App"**
3. Kliknij **"Analyze page load"**
4. Sprawdź sekcję **"Service Worker"**:
   - ✅ Service worker zarejestrowany
   - ✅ Service worker działa offline
   - ✅ Strona reaguje na 200 gdy offline

### PWA Builder

1. Przejdź do [PWA Builder](https://www.pwabuilder.com/)
2. Wprowadź URL swojej aplikacji
3. Kliknij **"Test your PWA"**
4. Sprawdź wyniki testów service workera

### Chrome DevTools - Network Throttling

1. Otwórz DevTools → zakładka **"Network"**
2. Włącz **"Offline"** mode
3. Odśwież stronę
4. Sprawdź czy aplikacja działa offline (jeśli zaimplementowane)

## 🐛 Rozwiązywanie problemów

### Problem: Service worker nie jest zarejestrowany

**Możliwe przyczyny:**
- Aplikacja działa w trybie development (`npm run dev`)
- Brak pliku `sw.js` w folderze `public/`
- Błąd w konfiguracji `next.config.ts`

**Rozwiązanie:**
1. Zbuduj aplikację: `npm run build`
2. Sprawdź czy plik `public/sw.js` istnieje
3. Sprawdź konfigurację w `next.config.ts`

### Problem: Service worker ma status "redundant"

**Przyczyna:** Został zastąpiony nową wersją

**Rozwiązanie:**
1. Odśwież stronę (Cmd+Shift+R / Ctrl+Shift+R)
2. W DevTools → Application → Service Workers kliknij **"Unregister"** na starym service workerze
3. Odśwież stronę ponownie

### Problem: Service worker nie działa na produkcji

**Możliwe przyczyny:**
- Aplikacja nie działa na HTTPS
- Plik `sw.js` nie jest dostępny (404)
- Błąd w kodzie service workera

**Rozwiązanie:**
1. Sprawdź czy aplikacja działa na HTTPS
2. Sprawdź dostępność `https://twoja-domena.com/sw.js`
3. Sprawdź logi w konsoli przeglądarki
4. Sprawdź logi serwera (Vercel/Netlify/etc.)

### Problem: Powiadomienia push nie działają

**Możliwe przyczyny:**
- Service worker nie jest aktywny
- Brak subskrypcji push
- Błąd w konfiguracji VAPID keys

**Rozwiązanie:**
1. Sprawdź czy service worker jest aktywny (patrz wyżej)
2. Sprawdź subskrypcję push (patrz Krok 3.1)
3. Sprawdź konfigurację VAPID keys w `.env`
4. Sprawdź logi w konsoli service workera

## ✅ Checklist przed wdrożeniem

- [ ] Build zakończył się bez błędów
- [ ] Plik `public/sw.js` został wygenerowany
- [ ] Service worker działa lokalnie (po `npm run build && npm start`)
- [ ] Service worker jest widoczny w DevTools → Application → Service Workers
- [ ] Status service workera to "activated and is running"
- [ ] Plik `sw.js` jest dostępny na produkcji (nie 404)
- [ ] Service worker działa na produkcji
- [ ] Powiadomienia push działają (jeśli używane)
- [ ] Cache działa poprawnie
- [ ] Aplikacja działa offline (jeśli zaimplementowane)
- [ ] Lighthouse PWA test przechodzi pomyślnie

## 📚 Przydatne linki

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Chrome DevTools: Service Workers](https://developer.chrome.com/docs/devtools/progressive-web-apps/#service-workers)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

## 🔧 Komendy pomocnicze

```bash
# Zbuduj aplikację
npm run build

# Uruchom w trybie produkcyjnym
npm start

# Sprawdź czy plik sw.js istnieje
ls -la public/sw.js

# Sprawdź zawartość pliku sw.js (pierwsze 50 linii)
head -50 public/sw.js

# Sprawdź rozmiar pliku
du -h public/sw.js
```

