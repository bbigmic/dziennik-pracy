import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś asystentem, który pomaga w tworzeniu zadań do wykonania. 
Użytkownik mówi głosówką zadanie, które chce dodać do listy "Do zrobienia".

Twoim zadaniem jest:
1. Wyciągnąć z transkrypcji główne zadanie (tytuł)
2. Opcjonalnie wyciągnąć dodatkowe szczegóły (opis)
3. Określić priorytet na podstawie kontekstu (low/medium/high)
   - "pilne", "ważne", "natychmiast" = high
   - "kiedyś", "może", "niepilne" = low
   - domyślnie = medium
4. Wyciągnąć deadline jeśli jest wspomniany w głosówce
   - Rozpoznaj daty: "jutro", "pojutrze", "w piątek", "15 stycznia", "za tydzień", "do końca tygodnia" itp.
   - Rozpoznaj godziny: "o 14:00", "o 15:30", "przed południem", "wieczorem" itp.
   - Format daty: YYYY-MM-DD (np. 2025-01-15)
   - Format godziny: HH:mm (np. 14:30)
   - Jeśli data nie jest wspomniana, ustaw deadline na null
   - Jeśli data jest wspomniana ale godzina nie, ustaw deadlineTime na null

Dzisiaj jest: ${todayStr}

Odpowiedz TYLKO w formacie JSON:
{
  "title": "Krótki, zwięzły tytuł zadania",
  "description": "Opcjonalny opis szczegółów (lub null jeśli brak)",
  "priority": "low" | "medium" | "high",
  "deadline": "YYYY-MM-DD lub null",
  "deadlineTime": "HH:mm lub null"
}

Przykłady:
- "Muszę przygotować prezentację na jutro" → {"title": "Przygotować prezentację", "description": null, "priority": "high", "deadline": "2025-01-16", "deadlineTime": null}
- "Zadzwonić do klienta w sprawie projektu o 14:00" → {"title": "Zadzwonić do klienta", "description": "W sprawie projektu", "priority": "medium", "deadline": null, "deadlineTime": null}
- "Kiedyś zaktualizować dokumentację" → {"title": "Zaktualizować dokumentację", "description": null, "priority": "low", "deadline": null, "deadlineTime": null}
- "Spotkanie z zespołem w piątek o 10:00" → {"title": "Spotkanie z zespołem", "description": null, "priority": "medium", "deadline": "2025-01-17", "deadlineTime": "10:00"}
- "Zrobić raport do końca tygodnia" → {"title": "Zrobić raport", "description": null, "priority": "high", "deadline": "2025-01-19", "deadlineTime": null}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from AI');
    }

    const task = JSON.parse(responseText);

    // Walidacja
    if (!task.title) {
      throw new Error('No title in response');
    }

    if (!['low', 'medium', 'high'].includes(task.priority)) {
      task.priority = 'medium';
    }

    // Walidacja deadline
    if (task.deadline && task.deadline !== 'null') {
      // Sprawdź czy format jest poprawny (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(task.deadline)) {
        task.deadline = null;
      }
    } else {
      task.deadline = null;
    }

    // Walidacja deadlineTime
    if (task.deadlineTime && task.deadlineTime !== 'null') {
      // Sprawdź czy format jest poprawny (HH:mm)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(task.deadlineTime)) {
        task.deadlineTime = null;
      }
    } else {
      task.deadlineTime = null;
    }

    // Jeśli nie ma deadline, nie ma też deadlineTime
    if (!task.deadline) {
      task.deadlineTime = null;
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process task' },
      { status: 500 }
    );
  }
}
