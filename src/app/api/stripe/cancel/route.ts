import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Nie znaleziono aktywnej subskrypcji' },
        { status: 404 }
      );
    }

    // Anuluj subskrypcję w Stripe (anulowanie na koniec okresu - cancel_at_period_end)
    const canceledSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Aktualizuj datę końca okresu w bazie
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCurrentPeriodEnd: new Date(
          (canceledSubscription as any).current_period_end * 1000
        ),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego',
      subscriptionEndsAt: new Date(
        (canceledSubscription as any).current_period_end * 1000
      ).toISOString(),
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas anulowania subskrypcji' },
      { status: 500 }
    );
  }
}

