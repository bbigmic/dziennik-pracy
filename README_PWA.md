# 🚀 Szybki start - PWA

Aplikacja została skonfigurowana jako Progressive Web App. Oto jak rozpocząć:

## 📋 Wymagane kroki przed użyciem

### 1. Wygeneruj ikony PWA

Aplikacja wymaga ikon w różnych rozmiarach. Masz dwie opcje:

#### Opcja A: Użyj skryptu (wymaga `sharp`)

```bash
# Zainstaluj sharp (jeśli jeszcze nie masz)
npm install --save-dev sharp

# Przygotuj główną ikonę (512x512px) jako icon-source.png w głównym folderze
# Następnie uruchom:
npm run generate-icons
```

#### Opcja B: Użyj narzędzia online

1. Przygotuj ikonę 512x512px
2. Użyj [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) lub [RealFaviconGenerator](https://realfavicongenerator.net/)
3. Pobierz ikony i umieść w folderze `/public/`:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### 2. Zbuduj aplikację

```bash
npm run build
npm start
```

**Uwaga:** Build używa `--webpack` flag, ponieważ `next-pwa` wymaga webpack (nie Turbopack).

### 3. Przetestuj PWA

1. Otwórz aplikację w przeglądarce (Chrome/Edge)
2. Sprawdź w DevTools (F12) → Application → Manifest
3. Sprawdź Service Worker w Application → Service Workers
4. Spróbuj zainstalować aplikację (ikonka instalacji w pasku adresu)

## 📱 Instalacja na urządzeniu mobilnym

### Android (Chrome)

1. Otwórz aplikację w Chrome na Androidzie
2. Menu (3 kropki) → "Zainstaluj aplikację" / "Add to Home screen"
3. Potwierdź instalację

### iOS (Safari)

1. Otwórz aplikację w Safari na iOS
2. Kliknij przycisk "Udostępnij" (kwadrat ze strzałką)
3. Wybierz "Dodaj do ekranu głównego"
4. Potwierdź instalację

## 🏪 Publikacja w sklepach

Szczegółowe instrukcje znajdziesz w pliku [PWA_SETUP.md](./PWA_SETUP.md).

### Google Play Store

- Użyj **Bubblewrap** do utworzenia TWA (Trusted Web Activity)
- Koszt: $25 USD (jednorazowo)
- Zobacz sekcję "Google Play Store" w PWA_SETUP.md

### Apple App Store

- Użyj **Capacitor** do opakowania w natywną aplikację iOS
- Koszt: $99 USD/rok
- Zobacz sekcję "Apple App Store" w PWA_SETUP.md

## ⚠️ Ważne uwagi

- **HTTPS jest wymagane** - PWA nie działa na HTTP (poza localhost)
- **Ikony są wymagane** - aplikacja nie będzie działać bez ikon
- **Service Worker** jest wyłączony w trybie development
- **Build używa webpack** - zobacz `package.json` → `build` script

## 🔧 Rozwiązywanie problemów

### Service Worker nie działa

- Sprawdź czy aplikacja działa na HTTPS (lub localhost)
- Sprawdź DevTools → Application → Service Workers
- Upewnij się, że ikony istnieją w `/public/`

### Build nie działa

- Upewnij się, że używasz `npm run build` (z flagą `--webpack`)
- Sprawdź czy `next-pwa` jest zainstalowane: `npm list next-pwa`

### Ikony nie wyświetlają się

- Sprawdź czy wszystkie ikony istnieją w `/public/`
- Sprawdź konsolę przeglądarki pod kątem błędów 404
- Zweryfikuj `manifest.json` - ścieżki do ikon

## 📚 Więcej informacji

Zobacz [PWA_SETUP.md](./PWA_SETUP.md) dla szczegółowej dokumentacji.

