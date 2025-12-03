# ✅ Checklist testowania powiadomień push

## 📋 Przed testowaniem - sprawdź:

### 1. Baza danych
- [ ] Wykonano migrację: `npx prisma migrate dev --name add_push_subscriptions`
- [ ] Tabela `PushSubscription` istnieje w bazie danych
- [ ] Sprawdź: `npx prisma studio` → powinna być widoczna tabela PushSubscription

### 2. Zmienne środowiskowe
Sprawdź czy w `.env.local` (lokalnie) i w Vercel (Settings → Environment Variables) są ustawione:
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - klucz publiczny VAPID
- [ ] `VAPID_PRIVATE_KEY` - klucz prywatny VAPID
- [ ] `VAPID_SUBJECT` - email (np. `mailto:admin@example.com`)
- [ ] `CRON_SECRET` - opcjonalnie, dla zewnętrznych cron jobs

### 3. Vercel Cron
- [ ] Plik `vercel.json` istnieje i jest poprawnie skonfigurowany
- [ ] Po wdrożeniu na Vercel, sprawdź w dashboard: Settings → Cron Jobs
- [ ] Cron powinien być widoczny jako aktywny

### 4. Build i deploy
- [ ] Aplikacja została zbudowana: `npm run build`
- [ ] Aplikacja została wdrożona na Vercel
- [ ] Service Worker jest aktywny (sprawdź w DevTools → Application → Service Workers)

## 🧪 Testowanie krok po kroku

### Krok 1: Włącz powiadomienia w aplikacji
1. [ ] Zaloguj się do aplikacji
2. [ ] Kliknij ikonkę użytkownika (User) w prawym górnym rogu
3. [ ] Przewiń do sekcji "Powiadomienia push"
4. [ ] Kliknij "Włącz powiadomienia"
5. [ ] Zatwierdź prośbę o pozwolenie w przeglądarce
6. [ ] Powinien pojawić się przycisk "Wyłącz powiadomienia" (oznacza że subskrypcja działa)

### Krok 2: Utwórz zadanie z deadline'em dzisiaj
1. [ ] Dodaj nowe zadanie (todo) w aplikacji
2. [ ] Ustaw deadline na **dzisiaj**
3. [ ] Opcjonalnie ustaw czas deadline'u (np. 15:00)
4. [ ] Zapisz zadanie
5. [ ] Sprawdź w bazie danych czy zadanie ma poprawny deadline:
   ```sql
   SELECT * FROM "AssignedTask" WHERE deadline = CURRENT_DATE;
   ```

### Krok 3: Sprawdź subskrypcję w bazie danych
1. [ ] Otwórz `npx prisma studio`
2. [ ] Przejdź do tabeli `PushSubscription`
3. [ ] Powinna być co najmniej jedna subskrypcja z Twoim `userId`
4. [ ] Sprawdź czy `endpoint`, `p256dh` i `auth` są wypełnione

### Krok 4: Test ręczny endpointu (opcjonalnie)
Możesz ręcznie wywołać endpoint do testowania:

```bash
# Lokalnie (wymaga CRON_SECRET w .env.local)
curl -X POST http://localhost:3000/api/push/notify \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Na Vercel (używa x-vercel-cron header automatycznie)
curl -X POST https://twoja-domena.vercel.app/api/push/notify \
  -H "x-vercel-cron: 1"
```

Odpowiedź powinna wyglądać tak:
```json
{
  "success": true,
  "tasksFound": 1,
  "notificationsSent": 1,
  "errors": 0
}
```

### Krok 5: Czekaj na cron job (14:00)
1. [ ] Sprawdź czy cron job jest zaplanowany na 14:00
2. [ ] O 14:00 powinieneś otrzymać powiadomienie push
3. [ ] Sprawdź logi w Vercel Dashboard → Functions → `/api/push/notify`

### Krok 6: Test natychmiastowy (dla szybkiego testu)
Jeśli nie chcesz czekać do 14:00, możesz:
1. [ ] Zaktualizować `vercel.json` na krótszy interwał (np. `*/5 * * * *` = co 5 minut)
2. [ ] Albo ręcznie wywołać endpoint (patrz Krok 4)
3. [ ] Albo użyć Vercel CLI: `vercel cron trigger`

## 🔍 Rozwiązywanie problemów

### Powiadomienia nie działają

**Problem:** Nie otrzymuję powiadomień
- [ ] Sprawdź czy pozwoliłeś na powiadomienia w przeglądarce
- [ ] Sprawdź czy subskrypcja istnieje w bazie danych
- [ ] Sprawdź czy VAPID keys są poprawne
- [ ] Sprawdź logi w Vercel Dashboard

**Problem:** Endpoint zwraca błąd 401
- [ ] Sprawdź czy używasz Vercel Cron (automatyczny header)
- [ ] Albo sprawdź czy `CRON_SECRET` jest poprawny

**Problem:** Endpoint zwraca błąd 500
- [ ] Sprawdź logi w Vercel Dashboard
- [ ] Sprawdź czy VAPID keys są skonfigurowane
- [ ] Sprawdź czy baza danych jest dostępna

**Problem:** Cron job nie działa
- [ ] Sprawdź w Vercel Dashboard → Settings → Cron Jobs
- [ ] Sprawdź czy `vercel.json` jest poprawnie sformatowany
- [ ] Sprawdź czy aplikacja jest wdrożona na Vercel

### Sprawdzanie w DevTools

1. [ ] Otwórz DevTools (F12)
2. [ ] Przejdź do Application → Service Workers
3. [ ] Sprawdź czy service worker jest aktywny
4. [ ] Przejdź do Application → Notifications
5. [ ] Sprawdź czy powiadomienia są dozwolone

## ✅ Gotowe do produkcji gdy:

- [x] Wszystkie checkboxy powyżej są zaznaczone
- [x] Powiadomienia działają w testach
- [x] Cron job działa poprawnie
- [x] VAPID keys są bezpiecznie przechowywane w Vercel
- [x] Baza danych jest w produkcji

## 📝 Notatki testowe

Data testu: _______________
Tester: _______________
Wynik: _______________
Uwagi: _______________

