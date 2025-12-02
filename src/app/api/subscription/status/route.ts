import { NextResponse } from 'next/server';
import { getAuthSession, checkSubscription } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    const status = await checkSubscription(session.user.id);

    return NextResponse.json({
      isActive: status.isActive,
      isTrialing: status.isTrialing,
      trialEndsAt: status.trialEndsAt?.toISOString() || null,
      subscriptionEndsAt: status.subscriptionEndsAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania statusu' },
      { status: 500 }
    );
  }
}

