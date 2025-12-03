import { NextResponse } from 'next/server';
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

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Nieprawidłowa subskrypcja' },
        { status: 400 }
      );
    }

    // Sprawdź czy subskrypcja już istnieje
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Aktualizuj istniejącą subskrypcję
      await prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: session.user.id,
        },
      });
    } else {
      // Utwórz nową subskrypcję
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zapisywania subskrypcji' },
      { status: 500 }
    );
  }
}

