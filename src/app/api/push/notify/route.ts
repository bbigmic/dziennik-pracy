import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isToday, parseISO } from 'date-fns';
import webpush from 'web-push';

// VAPID keys - powinny być w zmiennych środowiskowych
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function POST(req: Request) {
  try {
    // Sprawdź czy to wywołanie z Vercel Cron (header x-vercel-cron)
    // lub z zewnętrznego cron (Authorization header)
    const vercelCronHeader = req.headers.get('x-vercel-cron');
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Vercel automatycznie dodaje header x-vercel-cron do żądań z cron job
    const isVercelCron = vercelCronHeader === '1';
    const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    if (!isVercelCron && !isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured, skipping notifications');
      return NextResponse.json({ 
        success: true, 
        message: 'VAPID keys not configured' 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Znajdź wszystkie zadania z deadline'em dzisiaj, które nie są ukończone
    const tasksWithDeadlines = await prisma.assignedTask.findMany({
      where: {
        deadline: {
          not: null,
        },
        completed: false,
      },
      include: {
        user: {
          include: {
            pushSubscriptions: true,
          },
        },
      },
    });

    // Filtruj zadania z deadline'em dzisiaj
    const todayTasks = tasksWithDeadlines.filter((task) => {
      if (!task.deadline) return false;
      const deadlineDate = parseISO(task.deadline);
      return isToday(deadlineDate);
    });

    let sentCount = 0;
    let errorCount = 0;

    // Wyślij powiadomienia dla każdego użytkownika
    for (const task of todayTasks) {
      if (task.user.pushSubscriptions.length === 0) continue;

      const taskTime = task.deadlineTime 
        ? ` o ${task.deadlineTime}` 
        : ' dzisiaj';
      
      const priorityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴',
      }[task.priority] || '📋';

      const notification = {
        title: `${priorityEmoji} Deadline dzisiaj${taskTime}`,
        body: task.title,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: `deadline-${task.id}`,
        requireInteraction: task.priority === 'high',
        data: {
          url: '/',
          taskId: task.id,
        },
      };

      // Wyślij do wszystkich subskrypcji użytkownika
      for (const subscription of task.user.pushSubscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify(notification)
          );
          sentCount++;
        } catch (error: any) {
          console.error('Error sending notification:', error);
          
          // Jeśli subskrypcja jest nieprawidłowa, usuń ją
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id },
            });
          }
          
          errorCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      tasksFound: todayTasks.length,
      notificationsSent: sentCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas wysyłania powiadomień' },
      { status: 500 }
    );
  }
}

