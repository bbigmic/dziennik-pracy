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

    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint jest wymagany' },
        { status: 400 }
      );
    }

    // Usuń subskrypcję
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania subskrypcji' },
      { status: 500 }
    );
  }
}

