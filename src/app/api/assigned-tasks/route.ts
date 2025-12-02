import { NextResponse } from 'next/server';
import { getAuthSession, checkSubscription } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - pobierz wszystkie przypisane zadania
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    const tasks = await prisma.assignedTask.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        deadline: task.deadline,
        deadlineTime: task.deadlineTime,
        createdAt: task.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zadań' },
      { status: 500 }
    );
  }
}

// POST - dodaj nowe przypisane zadanie
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

    const { title, description, category, priority, deadline, deadlineTime } =
      await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Tytuł jest wymagany' },
        { status: 400 }
      );
    }

    const task = await prisma.assignedTask.create({
      data: {
        title,
        description,
        category: category || 'todo',
        priority: priority || 'medium',
        deadline,
        deadlineTime,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      completed: task.completed,
      deadline: task.deadline,
      deadlineTime: task.deadlineTime,
      createdAt: task.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Create assigned task error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia zadania' },
      { status: 500 }
    );
  }
}

