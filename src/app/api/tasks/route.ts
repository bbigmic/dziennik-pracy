import { NextResponse } from 'next/server';
import { getAuthSession, checkSubscription } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - pobierz wszystkie zadania użytkownika
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Grupuj zadania według daty
    const grouped: Record<string, { date: string; tasks: Array<{ id: string; text: string; createdAt: string }> }> = {};
    
    for (const task of tasks) {
      if (!grouped[task.date]) {
        grouped[task.date] = { date: task.date, tasks: [] };
      }
      grouped[task.date].tasks.push({
        id: task.id,
        text: task.text,
        createdAt: task.createdAt.toISOString(),
      });
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zadań' },
      { status: 500 }
    );
  }
}

// POST - dodaj nowe zadanie
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    // Sprawdź subskrypcję
    const subscription = await checkSubscription(session.user.id);
    if (!subscription.isActive) {
      return NextResponse.json(
        { error: 'Twój trial wygasł. Subskrybuj, aby kontynuować.' },
        { status: 403 }
      );
    }

    const { date, text } = await req.json();

    if (!date || !text) {
      return NextResponse.json(
        { error: 'Data i tekst są wymagane' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        date,
        text,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      id: task.id,
      text: task.text,
      createdAt: task.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia zadania' },
      { status: 500 }
    );
  }
}

