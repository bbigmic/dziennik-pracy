import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - aktualizuj zadanie
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

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Tekst jest wymagany' },
        { status: 400 }
      );
    }

    // Sprawdź czy zadanie należy do użytkownika
    const existingTask = await prisma.task.findFirst({
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

    const task = await prisma.task.update({
      where: { id: id },
      data: { text },
    });

    return NextResponse.json({
      id: task.id,
      text: task.text,
      createdAt: task.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji zadania' },
      { status: 500 }
    );
  }
}

// DELETE - usuń zadanie
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
    const existingTask = await prisma.task.findFirst({
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

    await prisma.task.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania zadania' },
      { status: 500 }
    );
  }
}

