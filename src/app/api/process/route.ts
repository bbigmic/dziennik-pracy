import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text, date } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Jesteś asystentem, który pomaga w prowadzeniu dziennika pracy. 
Twoim zadaniem jest przetworzyć surową transkrypcję głosową użytkownika opisującą co zrobił w pracy i przekształcić ją w czytelny, profesjonalny wpis do dziennika pracy.

Zasady:
1. Zachowaj wszystkie istotne informacje o wykonanych zadaniach
2. Popraw błędy gramatyczne i stylistyczne
3. Usuń wypełniacze (np. "eee", "hmm", "no wiesz")
4. Sformatuj tekst jako czytelny opis wykonanych czynności
5. Jeśli jest wiele zadań, możesz je rozdzielić przecinkami lub średnikami
6. Odpowiadaj tylko sformatowanym tekstem, bez dodatkowych komentarzy
7. Zachowaj profesjonalny, ale naturalny ton

Data wpisu: ${date}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const processedText = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ processedText });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    );
  }
}

