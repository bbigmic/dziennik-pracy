import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Obecne hasło i nowe hasło są wymagane' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Nowe hasło musi mieć co najmniej 6 znaków' },
        { status: 400 }
      );
    }

    // Pobierz użytkownika z bazy danych
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Nie znaleziono użytkownika' },
        { status: 404 }
      );
    }

    // Sprawdź obecne hasło
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Nieprawidłowe obecne hasło' },
        { status: 400 }
      );
    }

    // Hashuj nowe hasło
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Zaktualizuj hasło
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zmiany hasła' },
      { status: 500 }
    );
  }
}

