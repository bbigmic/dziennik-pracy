import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, PRICE_ID } from '@/lib/stripe';

export async function POST() {
  try {
    // Sprawdź czy STRIPE_SECRET_KEY jest ustawiony
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY nie jest ustawiony');
      return NextResponse.json(
        { error: 'Konfiguracja płatności nie jest poprawnie skonfigurowana' },
        { status: 500 }
      );
    }

    // Sprawdź czy PRICE_ID jest ustawiony
    if (!PRICE_ID) {
      console.error('STRIPE_PRICE_ID nie jest ustawiony w zmiennych środowiskowych');
      return NextResponse.json(
        { error: 'Konfiguracja płatności nie jest poprawnie skonfigurowana' },
        { status: 500 }
      );
    }

    // Sprawdź czy NEXT_PUBLIC_APP_URL jest ustawiony
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('NEXT_PUBLIC_APP_URL nie jest ustawiony');
      return NextResponse.json(
        { error: 'Konfiguracja aplikacji nie jest poprawnie skonfigurowana' },
        { status: 500 }
      );
    }

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

    if (!user) {
      return NextResponse.json(
        { error: 'Nie znaleziono użytkownika' },
        { status: 404 }
      );
    }

    // Jeśli użytkownik ma już Stripe customer ID, sprawdź czy istnieje w aktualnym trybie
    let customerId = user.stripeCustomerId;

    if (customerId) {
      try {
        // Sprawdź czy customer istnieje w aktualnym trybie Stripe
        await stripe.customers.retrieve(customerId);
      } catch (error: any) {
        // Jeśli customer nie istnieje (np. jest z innego trybu), utwórz nowego
        if (error?.code === 'resource_missing') {
          console.log(`Customer ${customerId} nie istnieje w aktualnym trybie, tworzenie nowego...`);
          customerId = null; // Zresetuj, aby utworzyć nowego
        } else {
          throw error; // Rzuć dalej inne błędy
        }
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Utwórz sesję checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      metadata: {
        userId: user.id,
      },
    });

    if (!checkoutSession.url) {
      console.error('Stripe nie zwrócił URL dla sesji checkout:', checkoutSession.id);
      return NextResponse.json(
        { error: 'Nie udało się utworzyć sesji płatności. Spróbuj ponownie.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    console.error('Error details:', {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      statusCode: error?.statusCode,
      raw: error?.raw,
    });
    
    // Zwróć bardziej szczegółowy komunikat błędu w trybie development
    const errorMessage = error?.message || 'Nieznany błąd';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        error: 'Wystąpił błąd podczas tworzenia sesji płatności',
        details: isDevelopment ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

