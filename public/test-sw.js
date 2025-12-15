/**
 * Skrypt testowy do sprawdzania statusu Service Workera
 * 
 * Użycie:
 * 1. Otwórz konsolę przeglądarki (F12)
 * 2. Skopiuj i wklej ten kod
 * 3. Lub załaduj przez: <script src="/test-sw.js"></script>
 */

(function testServiceWorker() {
  console.log('🔍 Testowanie Service Workera...\n');

  // Sprawdź czy przeglądarka obsługuje service workery
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Twoja przeglądarka nie obsługuje Service Workers');
    return;
  }

  console.log('✅ Przeglądarka obsługuje Service Workers\n');

  // Sprawdź rejestracje
  navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    console.log(`📋 Znaleziono ${registrations.length} zarejestrowanych service workerów\n`);

    if (registrations.length === 0) {
      console.warn('⚠️ Brak zarejestrowanych service workerów!');
      console.log('💡 Sprawdź czy:');
      console.log('   - Aplikacja działa w trybie produkcyjnym (npm run build && npm start)');
      console.log('   - Plik sw.js istnieje w folderze public/');
      console.log('   - Aplikacja działa na HTTPS (lub localhost)');
      return;
    }

    // Sprawdź każdy service worker
    for (let i = 0; i < registrations.length; i++) {
      const reg = registrations[i];
      console.log(`\n📦 Service Worker #${i + 1}:`);

      if (reg.active) {
        console.log('   ✅ Status: Aktywny');
        console.log('   📍 URL:', reg.active.scriptURL);
        console.log('   🔄 State:', reg.active.state);
      } else {
        console.log('   ⚠️ Status: Nieaktywny');
      }

      if (reg.waiting) {
        console.log('   ⏳ Waiting: Istnieje nowa wersja czekająca na aktywację');
        console.log('   📍 Waiting URL:', reg.waiting.scriptURL);
      }

      if (reg.installing) {
        console.log('   🔄 Installing: Trwa instalacja nowej wersji');
      }

      // Sprawdź scope
      console.log('   🎯 Scope:', reg.scope);

      // Sprawdź powiadomienia push
      try {
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          console.log('   🔔 Push: Subskrypcja aktywna');
          const key = subscription.getKey('p256dh');
          const auth = subscription.getKey('auth');
          console.log('   🔑 Keys:', {
            p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))).substring(0, 20) + '...' : 'brak',
            auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))).substring(0, 20) + '...' : 'brak',
          });
        } else {
          console.log('   🔔 Push: Brak subskrypcji');
        }
      } catch (error) {
        console.error('   ❌ Błąd sprawdzania push:', error);
      }
    }

    // Sprawdź gotowość
    console.log('\n⏳ Sprawdzanie gotowości service workera...');
    try {
      const readyReg = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker jest gotowy!');
      console.log('   📍 URL:', readyReg.active?.scriptURL);
    } catch (error) {
      console.error('❌ Service Worker nie jest gotowy:', error);
    }

    // Sprawdź dostępność pliku sw.js
    console.log('\n📄 Sprawdzanie dostępności pliku sw.js...');
    try {
      const response = await fetch('/sw.js');
      if (response.ok) {
        const text = await response.text();
        console.log('✅ Plik sw.js jest dostępny');
        console.log('   📏 Rozmiar:', (text.length / 1024).toFixed(2), 'KB');
        console.log('   📝 Zawiera workbox:', text.includes('workbox'));
        console.log('   📝 Zawiera push handler:', text.includes('push'));
      } else {
        console.error('❌ Plik sw.js nie jest dostępny (status:', response.status, ')');
      }
    } catch (error) {
      console.error('❌ Błąd pobierania pliku sw.js:', error);
    }

    // Sprawdź cache
    console.log('\n💾 Sprawdzanie cache...');
    try {
      const cacheNames = await caches.keys();
      console.log(`✅ Znaleziono ${cacheNames.length} cache:`);
      cacheNames.forEach(name => {
        console.log('   📦', name);
      });
    } catch (error) {
      console.error('❌ Błąd sprawdzania cache:', error);
    }

    console.log('\n✨ Test zakończony!');
  }).catch(error => {
    console.error('❌ Błąd podczas testowania:', error);
  });
})();

