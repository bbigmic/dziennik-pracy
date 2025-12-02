import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password, name, termsAccepted, marketingAccepted } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i hasło są wymagane' },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'Musisz zaakceptować regulamin i politykę prywatności' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Hasło musi mieć co najmniej 6 znaków' },
        { status: 400 }
      );
    }

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik z tym adresem email już istnieje' },
        { status: 400 }
      );
    }

    // Hashuj hasło
    const hashedPassword = await bcrypt.hash(password, 12);

    // Oblicz datę zakończenia 7-dniowego trialu
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // Utwórz użytkownika
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        trialEndsAt,
        termsAccepted: true,
        marketingAccepted: marketingAccepted || false,
        consentsAcceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      trialEndsAt: user.trialEndsAt,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas rejestracji' },
      { status: 500 }
    );
  }
}

