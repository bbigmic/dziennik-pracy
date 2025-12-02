import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - aktualizuj przypisane zadanie
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    const updates = await req.json();

    // Sprawdź czy zadanie należy do użytkownika
    const existingTask = await prisma.assignedTask.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Nie znaleziono zadania' },
        { status: 404 }
      );
    }

    const task = await prisma.assignedTask.update({
      where: { id: id },
      data: updates,
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
    console.error('Update assigned task error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji zadania' },
      { status: 500 }
    );
  }
}

// DELETE - usuń przypisane zadanie
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Musisz być zalogowany' },
        { status: 401 }
      );
    }

    // Sprawdź czy zadanie należy do użytkownika
    const existingTask = await prisma.assignedTask.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Nie znaleziono zadania' },
        { status: 404 }
      );
    }

    await prisma.assignedTask.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete assigned task error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania zadania' },
      { status: 500 }
    );
  }
}

