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

// GET - Vercel Cron używa GET, więc musimy to obsłużyć
export async function GET(req: Request) {
  // Sprawdź czy to wywołanie z Vercel Cron
  const vercelCronHeader = req.headers.get('x-vercel-cron') || 
                           req.headers.get('X-Vercel-Cron') ||
                           req.headers.get('X-VERCEL-CRON');
  
  // W produkcji pozwól tylko z headerem Vercel Cron
  if (process.env.NODE_ENV === 'production' && vercelCronHeader !== '1') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  
  // Wywołaj POST logic
  return POST(req);
}

export async function POST(req: Request) {
  console.log('=== Push notification endpoint called ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Sprawdź czy to wywołanie z Vercel Cron (header x-vercel-cron)
    // lub z zewnętrznego cron (Authorization header)
    const vercelCronHeader = req.headers.get('x-vercel-cron');
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    console.log('Headers:', {
      'x-vercel-cron': vercelCronHeader,
      'authorization': authHeader ? 'present' : 'missing',
    });
    
    // Vercel automatycznie dodaje header x-vercel-cron do żądań z cron job
    const isVercelCron = vercelCronHeader === '1';
    const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    console.log('Auth check:', { isVercelCron, isAuthorized });
    
    if (!isVercelCron && !isAuthorized) {
      console.error('Unauthorized request');
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

    console.log('VAPID keys configured');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Today date:', today.toISOString().split('T')[0]);

    // Znajdź wszystkie zadania z deadline'em dzisiaj, które nie są ukończone
    console.log('Fetching tasks with deadlines...');
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

    console.log(`Found ${tasksWithDeadlines.length} tasks with deadlines`);

    // Filtruj zadania z deadline'em dzisiaj
    const todayTasks = tasksWithDeadlines.filter((task) => {
      if (!task.deadline) return false;
      const deadlineDate = parseISO(task.deadline);
      const isTodayTask = isToday(deadlineDate);
      console.log(`Task ${task.id}: deadline=${task.deadline}, isToday=${isTodayTask}`);
      return isTodayTask;
    });

    console.log(`Found ${todayTasks.length} tasks with deadline today`);

    let sentCount = 0;
    let errorCount = 0;

    // Wyślij powiadomienia dla każdego użytkownika
    for (const task of todayTasks) {
      console.log(`Processing task ${task.id} for user ${task.userId}`);
      console.log(`User has ${task.user.pushSubscriptions.length} push subscriptions`);
      
      if (task.user.pushSubscriptions.length === 0) {
        console.log(`Skipping task ${task.id} - user has no push subscriptions`);
        continue;
      }

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
          console.log(`Sending notification to subscription ${subscription.id}`);
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
          console.log(`Notification sent successfully to subscription ${subscription.id}`);
          sentCount++;
        } catch (error: any) {
          console.error('Error sending notification:', error);
          console.error('Error details:', {
            statusCode: error.statusCode,
            message: error.message,
            endpoint: subscription.endpoint.substring(0, 50) + '...',
          });
          
          // Jeśli subskrypcja jest nieprawidłowa, usuń ją
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing invalid subscription ${subscription.id}`);
            await prisma.pushSubscription.delete({
              where: { id: subscription.id },
            });
          }
          
          errorCount++;
        }
      }
    }

    const result = {
      success: true,
      tasksFound: todayTasks.length,
      notificationsSent: sentCount,
      errors: errorCount,
    };
    
    console.log('=== Push notification result ===', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas wysyłania powiadomień' },
      { status: 500 }
    );
  }
}

