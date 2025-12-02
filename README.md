# 📋 Dziennik Pracy

Aplikacja do rejestrowania wykonanych czynności w pracy za pomocą nagrań głosowych i AI.

## ✨ Funkcje

- 📅 **Kalendarz miesięczny** - przeglądaj i dodawaj wpisy dla każdego dnia
- 🎤 **Nagrywanie głosowe** - nagraj co zrobiłeś, a AI przetworzy i zapisze
- 🤖 **Przetwarzanie AI** - transkrypcja przez Whisper + formatowanie przez GPT-4
- 📝 **Edycja wpisów** - możliwość ręcznego dodawania i edycji
- 💾 **Lokalne przechowywanie** - dane zapisywane w localStorage

## 🚀 Uruchomienie

### 1. Zainstaluj zależności

```bash
npm install
```

### 2. Skonfiguruj klucz API OpenAI

Edytuj plik `.env.local` i dodaj swój klucz API:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Uruchom aplikację

```bash
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce.

## 🛠️ Technologie

- **Next.js 15** - framework React z App Router
- **TypeScript** - typowanie statyczne
- **Tailwind CSS** - stylowanie
- **OpenAI API** - transkrypcja (Whisper) i przetwarzanie (GPT-4o-mini)
- **date-fns** - obsługa dat
- **Lucide React** - ikony

## 📱 Jak używać

1. **Kliknij na dzień** w kalendarzu
2. **Naciśnij przycisk mikrofonu** i opowiedz co zrobiłeś
3. **Zatrzymaj nagrywanie** - AI przetworzy nagranie i doda wpis
4. **Możesz też dodać wpis ręcznie** klikając "Dodaj ręcznie"

## 📁 Struktura projektu

```
src/
├── app/
│   ├── api/
│   │   ├── transcribe/   # API transkrypcji Whisper
│   │   └── process/      # API przetwarzania GPT
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AudioRecorder.tsx # Komponent nagrywania
│   ├── Calendar.tsx      # Kalendarz miesięczny
│   ├── DayModal.tsx      # Modal dnia
│   └── TaskList.tsx      # Lista zadań
├── hooks/
│   └── useLocalStorage.ts # Hook do localStorage
└── types/
    └── index.ts          # Definicje typów
```

## 🔒 Prywatność

Wszystkie dane są przechowywane lokalnie w przeglądarce (localStorage). 
Nagrania audio są przesyłane tylko do API OpenAI w celu transkrypcji.
