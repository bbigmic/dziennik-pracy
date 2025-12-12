import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Kod aktywacyjny jest wymagany' },
        { status: 400 }
      );
    }

    const activationCode = process.env.ACTIVATION_CODE;

    if (!activationCode) {
      return NextResponse.json(
        { error: 'Kod aktywacyjny nie jest skonfigurowany' },
        { status: 500 }
      );
    }

    // Sprawdź czy kod jest poprawny (case-insensitive)
    if (code.toLowerCase().trim() !== activationCode.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'Nieprawidłowy kod aktywacyjny' },
        { status: 400 }
      );
    }

    // Pobierz użytkownika
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Nie znaleziono użytkownika' },
        { status: 404 }
      );
    }

    // Sprawdź czy użytkownik już użył tego kodu (możemy dodać pole do bazy, ale na razie sprawdzamy czy ma już aktywną subskrypcję)
    // Dla uproszczenia, pozwólmy użyć kodu tylko jeśli nie ma aktywnej subskrypcji
    const now = new Date();
    const hasActiveSubscription = user.stripeCurrentPeriodEnd 
      ? user.stripeCurrentPeriodEnd > now 
      : false;

    if (hasActiveSubscription) {
      return NextResponse.json(
        { error: 'Masz już aktywną subskrypcję' },
        { status: 400 }
      );
    }

    // Aktywuj subskrypcję na miesiąc (30 dni)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCurrentPeriodEnd: subscriptionEndDate,
        // Ustawiamy również stripePriceId jako "activation" żeby wiedzieć że to aktywacja kodem
        stripePriceId: 'activation_code',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kod aktywacyjny został zastosowany pomyślnie',
      subscriptionEndsAt: subscriptionEndDate.toISOString(),
    });
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktywacji kodu' },
      { status: 500 }
    );
  }
}

