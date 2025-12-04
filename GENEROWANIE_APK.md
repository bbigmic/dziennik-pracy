# 📱 Generowanie pliku APK z PWA

Ten przewodnik pokazuje, jak przekształcić Twoją aplikację PWA w plik APK dla Androida.

## ⚡ Najprostsza metoda (jeśli masz aplikację na Vercel)

Jeśli Twoja aplikacja jest już wdrożona na Vercel (lub innej platformie z HTTPS), możesz wygenerować APK w **2 minuty**:

1. **Otwórz [PWA Builder](https://www.pwabuilder.com/)**
2. **Wklej URL swojej aplikacji z Vercel** (np. `https://dziennik-pracy.vercel.app`)
3. **Kliknij "Start"** → PWA Builder automatycznie wykryje manifest.json
4. **Kliknij "Build My PWA"** → Wybierz "Android"
5. **Pobierz wygenerowany APK** → Gotowe! 🎉

To wszystko! Nie potrzebujesz Android Studio, Java, ani żadnych dodatkowych narzędzi.

---

## 🎯 Wszystkie dostępne metody

### Metoda 1: PWA Builder (Najprostsza) ⭐ Zalecana dla szybkiego startu

PWA Builder to narzędzie Microsoft, które automatycznie generuje pliki APK z Twojej PWA.

#### Wymagania:
- ✅ Aplikacja PWA działająca na HTTPS (lub localhost dla testów)
- ✅ Ważny manifest.json
- ✅ Service Worker działający

#### Kroki:

1. **Przygotuj aplikację:**
   ```bash
   npm run build
   npm start
   ```
   Upewnij się, że aplikacja jest dostępna pod adresem HTTPS (lub użyj ngrok dla localhost).

2. **Otwórz PWA Builder:**
   - Przejdź do [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
   - Wprowadź URL swojej aplikacji (np. `https://twoja-domena.com`)

3. **Wygeneruj pakiet Android:**
   - Kliknij "Build My PWA"
   - Wybierz "Android"
   - Pobierz wygenerowany pakiet

4. **Opcjonalnie - dostosuj konfigurację:**
   - Możesz edytować `twa-manifest.json` przed budowaniem
   - Zmień nazwę pakietu, wersję, ikony itp.

5. **Zbuduj APK:**
   - PWA Builder wygeneruje plik APK, który możesz zainstalować bezpośrednio na urządzeniu Android

#### Zalety:
- ✅ Najprostsza metoda
- ✅ Nie wymaga Android Studio
- ✅ Automatyczna konfiguracja
- ✅ Działa z Next.js out-of-the-box

#### Wady:
- ⚠️ Ograniczona kontrola nad konfiguracją
- ⚠️ Wymaga publicznego URL (lub ngrok)

---

### Metoda 2: Bubblewrap (TWA) - Dla Google Play Store

Bubblewrap to oficjalne narzędzie Google do tworzenia Trusted Web Activity (TWA) z PWA.

#### Wymagania:
- ✅ Node.js 14+
- ✅ Java JDK 11+ (dla Android SDK)
- ✅ Android SDK (opcjonalnie, jeśli chcesz budować lokalnie)
- ✅ Aplikacja PWA na HTTPS

#### Instalacja:

```bash
npm install -g @bubblewrap/cli
```

#### Kroki:

1. **Zainicjalizuj projekt TWA:**
   ```bash
   bubblewrap init --manifest https://twoja-domena.com/manifest.json
   ```
   
   Lub użyj lokalnego manifestu:
   ```bash
   bubblewrap init --manifest ./public/manifest.json
   ```

2. **Skonfiguruj aplikację:**
   - Wypełnij dane aplikacji:
     - **Package ID**: np. `com.dziennikpracy.app` (musi być unikalny)
     - **Application Name**: "Dziennik Pracy"
     - **Application Version**: np. "1.0.0"
     - **Start URL**: "/"
     - **Display Mode**: "standalone"
   
   Plik konfiguracyjny zostanie zapisany w `twa-manifest.json`

3. **Wygeneruj klucz podpisywania (jeśli nie masz):**
   ```bash
   bubblewrap keygen --create
   ```
   To wygeneruje klucz w `~/.android/debug.keystore` (dla debug) lub możesz utworzyć własny:
   ```bash
   keytool -genkey -v -keystore dziennik-pracy.keystore -alias dziennik-pracy -keyalg RSA -keysize 2048 -validity 10000
   ```

4. **Zbuduj aplikację APK:**
   ```bash
   bubblewrap build
   ```
   
   Plik APK znajdziesz w: `./app/build/outputs/apk/debug/app-debug.apk`

5. **Zbuduj AAB (dla Google Play Store):**
   ```bash
   bubblewrap build --aab
   ```
   
   Plik AAB znajdziesz w: `./app/build/outputs/bundle/release/app-release.aab`

#### Konfiguracja zaawansowana:

Edytuj `twa-manifest.json` aby dostosować:
- Ikony aplikacji
- Kolory motywu
- Uprawnienia
- URL startowy
- Itp.

#### Zalety:
- ✅ Oficjalne narzędzie Google
- ✅ Pełna kontrola nad konfiguracją
- ✅ Generuje AAB dla Google Play
- ✅ Obsługa Digital Asset Links

#### Wady:
- ⚠️ Wymaga więcej konfiguracji
- ⚠️ Wymaga Java JDK i Android SDK (dla lokalnego budowania)

---

### Metoda 3: Capacitor (Najbardziej elastyczna)

Capacitor to framework Ionic, który opakowuje PWA w natywną aplikację.

#### Wymagania:
- ✅ Node.js 14+
- ✅ Android Studio (dla budowania APK)
- ✅ Java JDK 11+

#### Instalacja:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
```

#### Kroki:

1. **Zainicjalizuj Capacitor:**
   ```bash
   npx cap init "Dziennik Pracy" "com.dziennikpracy.app"
   ```

2. **Dodaj platformę Android:**
   ```bash
   npx cap add android
   ```

3. **Skonfiguruj build output:**
   
   Edytuj `next.config.ts` aby dodać eksport statyczny (opcjonalnie):
   ```typescript
   const nextConfig: NextConfig = {
     output: 'export', // Dla statycznego eksportu
     // ... reszta konfiguracji
   };
   ```

4. **Zbuduj aplikację Next.js:**
   ```bash
   npm run build
   ```

5. **Synchronizuj z Capacitor:**
   ```bash
   npx cap sync
   ```

6. **Otwórz w Android Studio:**
   ```bash
   npx cap open android
   ```

7. **Zbuduj APK w Android Studio:**
   - Otwórz projekt w Android Studio
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Plik APK znajdziesz w: `android/app/build/outputs/apk/`

#### Zalety:
- ✅ Najbardziej elastyczne rozwiązanie
- ✅ Możliwość dodania natywnych pluginów
- ✅ Obsługa iOS i Android
- ✅ Pełna kontrola nad kodem natywnym

#### Wady:
- ⚠️ Wymaga Android Studio
- ⚠️ Więcej konfiguracji
- ⚠️ Większy rozmiar aplikacji

---

## 🚀 Szybki start - PWA Builder (Rekomendowane)

### Jeśli masz aplikację na Vercel (najprostsze):

1. **Otwórz [PWA Builder](https://www.pwabuilder.com/)**
2. **Wklej URL z Vercel** (np. `https://dziennik-pracy.vercel.app`)
3. **Kliknij "Start"** → PWA Builder automatycznie wykryje Twoją PWA
4. **Kliknij "Build My PWA"** → Wybierz "Android"
5. **Pobierz APK** → Gotowe! 🎉

### Jeśli testujesz lokalnie:

1. **Zbuduj i uruchom aplikację:**
   ```bash
   npm run build
   npm start
   ```

2. **Użyj ngrok dla publicznego URL:**
   ```bash
   npx ngrok http 3000
   ```
   Skopiuj URL HTTPS z ngrok (np. `https://abc123.ngrok.io`)

3. **Otwórz PWA Builder:**
   - Idź do [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
   - Wklej URL z ngrok
   - Kliknij "Start"

4. **Pobierz APK:**
   - Kliknij "Build My PWA"
   - Wybierz "Android"
   - Pobierz wygenerowany APK

5. **Zainstaluj na urządzeniu:**
   - Przenieś plik APK na telefon Android
   - Włącz "Instalacja z nieznanych źródeł" w ustawieniach
   - Otwórz plik APK i zainstaluj

---

## 📋 Checklist przed generowaniem APK

- [ ] Aplikacja działa poprawnie na HTTPS
- [ ] Manifest.json jest poprawny i dostępny
- [ ] Service Worker działa
- [ ] Wszystkie ikony są dostępne
- [ ] Aplikacja jest responsywna
- [ ] Testowałeś na urządzeniu mobilnym

---

## 🔧 Rozwiązywanie problemów

### Problem: "Manifest nie został znaleziony"
**Rozwiązanie:** Upewnij się, że `manifest.json` jest dostępny pod `/manifest.json` i zawiera poprawne dane.

### Problem: "Service Worker nie działa"
**Rozwiązanie:** 
- Sprawdź, czy aplikacja działa na HTTPS (lub localhost)
- Sprawdź konfigurację w `next.config.ts`
- Sprawdź DevTools → Application → Service Workers

### Problem: "Ikony nie są dostępne"
**Rozwiązanie:** 
- Upewnij się, że wszystkie ikony są w folderze `/public/`
- Sprawdź ścieżki w `manifest.json`
- Użyj skryptu `npm run generate-icons` jeśli masz `icon-source.png`

### Problem: "APK nie instaluje się"
**Rozwiązanie:**
- Sprawdź, czy masz włączoną opcję "Instalacja z nieznanych źródeł"
- Sprawdź, czy APK jest podpisany (dla produkcji wymagany jest klucz podpisywania)
- Sprawdź logi: `adb logcat` podczas instalacji

---

## 📚 Przydatne linki

- [PWA Builder](https://www.pwabuilder.com/)
- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Trusted Web Activity Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Android APK Signing](https://developer.android.com/studio/publish/app-signing)

---

## 💡 Rekomendacja

Dla szybkiego startu i testów: **Użyj PWA Builder**

Dla publikacji w Google Play Store: **Użyj Bubblewrap**

Dla zaawansowanych funkcji i natywnych pluginów: **Użyj Capacitor**

