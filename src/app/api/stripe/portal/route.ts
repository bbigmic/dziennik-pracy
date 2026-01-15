import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

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

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Nie znaleziono konta Stripe' },
        { status: 404 }
      );
    }

    // Sprawdź czy customer istnieje w aktualnym trybie
    try {
      await stripe.customers.retrieve(user.stripeCustomerId);
    } catch (error: any) {
      if (error?.code === 'resource_missing') {
        // Customer jest z innego trybu (testowy vs live)
        // Wyczyść customer ID z bazy danych
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: null },
        });
        return NextResponse.json(
          { error: 'Konto Stripe nie jest dostępne. Wykup subskrypcję ponownie.' },
          { status: 404 }
        );
      }
      throw error;
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas otwierania portalu' },
      { status: 500 }
    );
  }
}

