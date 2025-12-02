# Konfiguracja PWA - Dziennik Pracy

Aplikacja została skonfigurowana jako Progressive Web App (PWA), co umożliwia instalację na urządzeniach mobilnych i desktopowych.

## ✅ Co zostało skonfigurowane

1. **next-pwa** - biblioteka do obsługi PWA w Next.js
2. **manifest.json** - plik manifestu z konfiguracją aplikacji
3. **Service Worker** - automatycznie generowany przez next-pwa
4. **Meta tagi** - zaktualizowane w layout.tsx dla lepszej kompatybilności

## 📱 Generowanie ikon PWA

Aby aplikacja działała poprawnie jako PWA, potrzebujesz ikon w różnych rozmiarach. Oto jak je wygenerować:

### Opcja 1: Użyj narzędzia online (zalecane)

1. Przygotuj główną ikonę w rozmiarze **512x512px** (PNG, przezroczyste tło)
2. Użyj jednego z narzędzi:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [PWA Builder](https://www.pwabuilder.com/imageGenerator)

3. Pobierz wygenerowane ikony i umieść je w folderze `/public/`:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### Opcja 2: Użyj ImageMagick (lokalnie)

```bash
# Zainstaluj ImageMagick (jeśli nie masz)
# macOS: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Utwórz ikony z głównej ikony (icon-512x512.png)
convert icon-512x512.png -resize 72x72 public/icon-72x72.png
convert icon-512x512.png -resize 96x96 public/icon-96x96.png
convert icon-512x512.png -resize 128x128 public/icon-128x128.png
convert icon-512x512.png -resize 144x144 public/icon-144x144.png
convert icon-512x512.png -resize 152x152 public/icon-152x152.png
convert icon-512x512.png -resize 192x192 public/icon-192x192.png
convert icon-512x512.png -resize 384x384 public/icon-384x384.png
cp icon-512x512.png public/icon-512x512.png
```

### Opcja 3: Użyj Node.js skryptu

Możesz użyć biblioteki `sharp` do automatycznego generowania ikon:

```bash
npm install --save-dev sharp
```

Następnie utwórz skrypt `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = 'icon-source.png'; // Twoja główna ikona
const outputDir = 'public';

sizes.forEach(size => {
  sharp(inputFile)
    .resize(size, size)
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .then(() => console.log(`✓ Generated icon-${size}x${size}.png`))
    .catch(err => console.error(`✗ Error generating icon-${size}x${size}.png:`, err));
});
```

## 🚀 Testowanie PWA lokalnie

1. **Zbuduj aplikację:**
   ```bash
   npm run build
   npm start
   ```

2. **Otwórz w przeglądarce:**
   - Chrome/Edge: `chrome://flags/#unsafely-treat-insecure-origin-as-secure` (dla localhost)
   - Lub użyj HTTPS lokalnie (np. ngrok lub mkcert)

3. **Sprawdź w DevTools:**
   - Otwórz DevTools (F12)
   - Przejdź do zakładki "Application" / "Aplikacja"
   - Sprawdź "Manifest" i "Service Workers"

## 📦 Publikacja w sklepach aplikacji

### Google Play Store (Android)

Aby opublikować PWA w Google Play, musisz użyć **Trusted Web Activity (TWA)**:

#### Krok 1: Przygotowanie

1. **Zainstaluj Bubblewrap CLI:**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Zainicjalizuj projekt TWA:**
   ```bash
   bubblewrap init --manifest https://twoja-domena.com/manifest.json
   ```

3. **Skonfiguruj aplikację:**
   - Wypełnij dane aplikacji (nazwa, pakiet, wersja)
   - Wygeneruj klucz podpisywania (jeśli nie masz)

4. **Zbuduj aplikację:**
   ```bash
   bubblewrap build
   ```

5. **Wygeneruj AAB (Android App Bundle):**
   ```bash
   bubblewrap build --aab
   ```

#### Krok 2: Publikacja

1. **Utwórz konto deweloperskie:**
   - Przejdź do [Google Play Console](https://play.google.com/console)
   - Zapłać jednorazową opłatę $25 USD

2. **Utwórz nową aplikację:**
   - Wypełnij wszystkie wymagane informacje
   - Prześlij AAB z folderu `bubblewrap/output/`
   - Dodaj zrzuty ekranu, opisy, ikony

3. **Prześlij do recenzji:**
   - Wypełnij formularz deklaracji treści
   - Prześlij aplikację do recenzji

#### Wymagania dla Google Play:

- ✅ HTTPS (wymagane dla PWA)
- ✅ Ważny manifest.json
- ✅ Service Worker działający
- ✅ Ikony w odpowiednich rozmiarach
- ✅ Polityka prywatności (jeśli zbierasz dane)

### Apple App Store (iOS)

Apple nie obsługuje bezpośrednio PWA w App Store. Musisz opakować aplikację w natywną powłokę iOS.

#### Opcja 1: Capacitor (zalecane)

1. **Zainstaluj Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/ios
   npx cap init
   ```

2. **Skonfiguruj iOS:**
   ```bash
   npx cap add ios
   npx cap sync
   ```

3. **Otwórz w Xcode:**
   ```bash
   npx cap open ios
   ```

4. **Skonfiguruj w Xcode:**
   - Ustaw Bundle Identifier
   - Dodaj ikony aplikacji
   - Skonfiguruj certyfikaty i profile

5. **Zbuduj i opublikuj:**
   - Archiwizuj aplikację w Xcode
   - Prześlij do App Store Connect
   - Wypełnij informacje w App Store Connect

#### Opcja 2: PWA Builder (Microsoft)

1. Przejdź do [PWA Builder](https://www.pwabuilder.com/)
2. Wprowadź URL swojej aplikacji
3. Wygeneruj pakiety dla iOS i Android
4. Postępuj zgodnie z instrukcjami

#### Wymagania dla App Store:

- ✅ Konto Apple Developer ($99 USD/rok)
- ✅ Xcode (tylko na macOS)
- ✅ Certyfikaty deweloperskie
- ✅ Zgodność z wytycznymi App Store
- ✅ Polityka prywatności

## 🔧 Konfiguracja produkcji

### Wymagania:

1. **HTTPS jest wymagane** - PWA nie działa na HTTP (poza localhost)
2. **Domena** - aplikacja musi być dostępna pod stałą domeną
3. **Service Worker** - musi być dostępny pod `/sw.js`

### Zmienne środowiskowe:

Upewnij się, że masz skonfigurowane:
- `NODE_ENV=production` w produkcji
- Wszystkie wymagane zmienne środowiskowe dla aplikacji

### Weryfikacja przed publikacją:

1. ✅ Sprawdź manifest.json w [Manifest Validator](https://manifest-validator.appspot.com/)
2. ✅ Przetestuj Service Worker w DevTools
3. ✅ Sprawdź responsywność na różnych urządzeniach
4. ✅ Przetestuj instalację PWA na urządzeniu mobilnym
5. ✅ Sprawdź działanie offline (jeśli zaimplementowane)

## 📚 Przydatne linki

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Google: Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [PWA Builder](https://www.pwabuilder.com/)

## ⚠️ Uwagi

- Service Worker jest **wyłączony w trybie development** (zobacz `next.config.ts`)
- W produkcji upewnij się, że aplikacja działa na HTTPS
- Ikony są wymagane - aplikacja nie będzie działać poprawnie bez nich
- Testuj na rzeczywistych urządzeniach przed publikacją

