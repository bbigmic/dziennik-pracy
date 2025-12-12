# 🔄 Przełączanie Stripe z Testowego na Produkcyjny (Live)

Ten przewodnik pomoże Ci przełączyć płatności Stripe z trybu testowego na produkcyjny.

## ⚠️ Ważne przed rozpoczęciem

- **Testowe klucze** zaczynają się od `sk_test_` i `pk_test_`
- **Produkcyjne klucze** zaczynają się od `sk_live_` i `pk_live_`
- Po przełączeniu na live, wszystkie płatności będą **prawdziwe** - upewnij się, że wszystko działa poprawnie!

## 📋 Krok 1: Przygotowanie w Stripe Dashboard

### 1.1. Przejdź do trybu Live w Stripe Dashboard

1. Zaloguj się do [Stripe Dashboard](https://dashboard.stripe.com)
2. W prawym górnym rogu przełącz tryb z **"Test mode"** na **"Live mode"** (przełącznik w górnym prawym rogu)

### 1.2. Utwórz produkt i cenę w trybie Live

1. Przejdź do **Products** w menu bocznym
2. Kliknij **"+ Add product"**
3. Wypełnij:
   - **Name**: np. "Dziennik Pracy - Subskrypcja tygodniowa"
   - **Description**: Opis produktu
   - **Pricing model**: Recurring (Subskrypcja)
   - **Price**: 8.00 PLN
   - **Billing period**: Weekly (Tygodniowo)
4. Kliknij **"Save product"**
5. **Skopiuj Price ID** (zaczyna się od `price_...`) - będziesz go potrzebować!

### 1.3. Pobierz Live Secret Key

1. Przejdź do **Developers** → **API keys**
2. Upewnij się, że jesteś w trybie **Live mode**
3. W sekcji **"Secret key"** kliknij **"Reveal test key"** (lub "Reveal live key")
4. **Skopiuj klucz** (zaczyna się od `sk_live_...`)
5. ⚠️ **WAŻNE**: Ten klucz jest wyświetlany tylko raz - zapisz go bezpiecznie!

### 1.4. Skonfiguruj Webhook dla Live Mode

1. Przejdź do **Developers** → **Webhooks**
2. Upewnij się, że jesteś w trybie **Live mode**
3. Kliknij **"+ Add endpoint"**
4. Wypełnij:
   - **Endpoint URL**: `https://twoja-domena.pl/api/stripe/webhook`
     - (Zastąp `twoja-domena.pl` swoją rzeczywistą domeną)
   - **Description**: "Webhook dla subskrypcji"
5. W sekcji **"Select events to listen to"** wybierz:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
6. Kliknij **"Add endpoint"**
7. Po utworzeniu, kliknij na endpoint i **skopiuj "Signing secret"** (zaczyna się od `whsec_...`)

## 🔧 Krok 2: Aktualizacja zmiennych środowiskowych

### 2.1. Lokalnie (dla testów)

Zaktualizuj plik `.env.local`:

```env
# Stripe - LIVE (Produkcyjne)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."  # ID ceny z trybu Live
```

### 2.2. Na produkcji (Vercel/Inne)

1. **Vercel**:
   - Przejdź do projektu w [Vercel Dashboard](https://vercel.com)
   - Kliknij **Settings** → **Environment Variables**
   - Zaktualizuj zmienne:
     - `STRIPE_SECRET_KEY` → wklej live secret key
     - `STRIPE_WEBHOOK_SECRET` → wklej live webhook secret
     - `STRIPE_PRICE_ID` → wklej live price ID
   - Kliknij **Save**
   - **Ważne**: Zrób redeploy aplikacji, aby zmiany weszły w życie!

2. **Inne platformy**:
   - Zaktualizuj zmienne środowiskowe zgodnie z dokumentacją swojej platformy
   - Upewnij się, że używasz **live** kluczy (zaczynających się od `sk_live_`)

## ✅ Krok 3: Weryfikacja

### 3.1. Sprawdź konfigurację

Upewnij się, że:
- ✅ Wszystkie klucze zaczynają się od `sk_live_` (nie `sk_test_`)
- ✅ Webhook secret zaczyna się od `whsec_`
- ✅ Price ID odpowiada produktowi w trybie Live
- ✅ Webhook endpoint wskazuje na poprawny URL produkcyjny

### 3.2. Przetestuj płatność

1. Przejdź na stronę produkcyjną
2. Spróbuj utworzyć subskrypcję
3. Użyj **testowej karty** Stripe (nawet w trybie live możesz testować):
   - Numer: `4242 4242 4242 4242`
   - Data: dowolna przyszła data
   - CVC: dowolne 3 cyfry
4. Sprawdź czy:
   - ✅ Checkout session się tworzy
   - ✅ Webhook otrzymuje eventy
   - ✅ Subskrypcja jest aktywowana w bazie danych

## 🔍 Krok 4: Monitoring

### 4.1. Sprawdź logi webhooków

1. W Stripe Dashboard przejdź do **Developers** → **Webhooks**
2. Kliknij na swój webhook endpoint
3. Sprawdź **"Recent events"** - powinny być oznaczone jako **"Succeeded"**

### 4.2. Sprawdź płatności

1. Przejdź do **Payments** w Stripe Dashboard
2. Upewnij się, że płatności są przetwarzane poprawnie

## ⚠️ Ważne uwagi

1. **Nie mieszaj kluczy**: Upewnij się, że wszystkie zmienne używają kluczy z tego samego trybu (wszystkie live lub wszystkie testowe)

2. **Webhook URL**: Musi wskazywać na produkcyjną domenę, nie na localhost

3. **Bezpieczeństwo**: Nigdy nie commituj live kluczy do repozytorium Git!

4. **Testowe płatności w Live**: W trybie live nadal możesz używać testowych kart do testowania, ale płatności będą widoczne w sekcji Live

5. **Migracja danych**: Jeśli masz testowych klientów, ich dane nie będą dostępne w trybie live - to są oddzielne środowiska

## 🆘 Rozwiązywanie problemów

### Problem: Webhook nie działa
- Sprawdź czy URL webhook jest poprawny i dostępny publicznie
- Sprawdź czy webhook secret jest poprawny
- Sprawdź logi w Stripe Dashboard → Webhooks → Recent events

### Problem: Błąd "Invalid API Key"
- Upewnij się, że używasz live klucza (sk_live_...)
- Sprawdź czy klucz nie ma dodatkowych spacji
- Sprawdź czy zmienne środowiskowe zostały zaktualizowane i aplikacja została zrestartowana

### Problem: Price ID nie działa
- Upewnij się, że Price ID pochodzi z trybu Live
- Sprawdź czy produkt jest aktywny w Stripe Dashboard

## 📞 Wsparcie

Jeśli masz problemy:
1. Sprawdź logi w Stripe Dashboard
2. Sprawdź logi aplikacji (Vercel logs, itp.)
3. Sprawdź dokumentację Stripe: https://stripe.com/docs

