import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, differenceInMinutes, isBefore } from 'date-fns';
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
  console.log('=== GET request to /api/push/notify ===');
  
  // Sprawdź wszystkie nagłówki
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });
  console.log('All headers:', JSON.stringify(allHeaders, null, 2));
  
  // Sprawdź czy to wywołanie z Vercel Cron
  const vercelCronHeader = req.headers.get('x-vercel-cron') || 
                           req.headers.get('X-Vercel-Cron') ||
                           req.headers.get('X-VERCEL-CRON');
  
  const userAgent = req.headers.get('user-agent') || '';
  const isVercelCron = userAgent.includes('vercel-cron');
  
  console.log('Vercel Cron check:', {
    vercelCronHeader,
    userAgent,
    isVercelCron,
    nodeEnv: process.env.NODE_ENV,
  });
  
  // W produkcji pozwól jeśli to Vercel Cron (sprawdź user-agent lub header)
  if (process.env.NODE_ENV === 'production') {
    if (vercelCronHeader !== '1' && !isVercelCron) {
      console.error('GET request blocked - not Vercel Cron');
      return NextResponse.json({ 
        error: 'Not allowed',
        debug: {
          hasVercelCronHeader: vercelCronHeader === '1',
          vercelCronHeaderValue: vercelCronHeader,
          userAgent,
          isVercelCron,
        }
      }, { status: 403 });
    }
  }
  
  console.log('GET request allowed, calling POST logic');
  // Wywołaj POST logic
  return POST(req);
}

export async function POST(req: Request) {
  console.log('=== Push notification endpoint called ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Sprawdź czy to wywołanie z Vercel Cron (header x-vercel-cron lub user-agent)
    // lub z zewnętrznego cron (Authorization header)
    const vercelCronHeader = req.headers.get('x-vercel-cron') || 
                             req.headers.get('X-Vercel-Cron') ||
                             req.headers.get('X-VERCEL-CRON');
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const userAgent = req.headers.get('user-agent') || '';
    const isVercelCronUserAgent = userAgent.includes('vercel-cron');
    
    console.log('Headers:', {
      'x-vercel-cron': vercelCronHeader,
      'authorization': authHeader ? 'present' : 'missing',
      'user-agent': userAgent,
    });
    
    // Vercel automatycznie dodaje header x-vercel-cron do żądań z cron job
    // Albo używa user-agent: vercel-cron/1.0
    const isVercelCron = vercelCronHeader === '1' || isVercelCronUserAgent;
    const isAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    console.log('Auth check:', { 
      isVercelCron, 
      isAuthorized,
      hasVercelCronHeader: vercelCronHeader === '1',
      hasVercelCronUserAgent: isVercelCronUserAgent,
    });
    
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

    const now = new Date();
    console.log('Current time:', now.toISOString());

    // Znajdź wszystkie zadania z deadline'em, które nie są ukończone i nie mają jeszcze wysłanego powiadomienia
    console.log('Fetching tasks with deadlines...');
    const tasksWithDeadlines = await prisma.assignedTask.findMany({
      where: {
        deadline: {
          not: null,
        },
        completed: false,
        notificationSentAt: null, // Tylko zadania, dla których jeszcze nie wysłaliśmy powiadomienia
      },
      include: {
        user: {
          include: {
            pushSubscriptions: true,
          },
        },
      },
    });

    console.log(`Found ${tasksWithDeadlines.length} tasks with deadlines (without notification)`);

    // Filtruj zadania z deadline'em za godzinę (w przedziale 50-70 minut)
    // To daje nam okno 20 minut na wysłanie powiadomienia, co wystarczy dla cron job uruchamianego co 15 minut
    const tasksToNotify = tasksWithDeadlines.filter((task) => {
      if (!task.deadline) return false;
      
      // Utwórz pełną datę deadline'u
      let deadlineDate = parseISO(task.deadline);
      
      if (task.deadlineTime) {
        const [hours, minutes] = task.deadlineTime.split(':').map(Number);
        deadlineDate = new Date(deadlineDate);
        deadlineDate.setHours(hours, minutes, 0, 0);
      } else {
        // Jeśli nie ma czasu, ustaw na koniec dnia (23:59:59)
        deadlineDate = new Date(deadlineDate);
        deadlineDate.setHours(23, 59, 59, 999);
      }
      
      // Sprawdź czy deadline jest w przyszłości
      if (isBefore(deadlineDate, now)) {
        return false; // Deadline już minął
      }
      
      // Oblicz różnicę w minutach między teraz a deadline'em
      const minutesUntilDeadline = differenceInMinutes(deadlineDate, now);
      
      // Powiadomienie powinno być wysłane godzinę przed deadline'em (60 minut)
      // Używamy przedziału 50-70 minut, aby dać okno na wysłanie powiadomienia
      const shouldNotify = minutesUntilDeadline >= 50 && minutesUntilDeadline <= 70;
      
      console.log(`Task ${task.id}: deadline=${task.deadline} ${task.deadlineTime || ''}, minutesUntilDeadline=${minutesUntilDeadline}, shouldNotify=${shouldNotify}`);
      
      return shouldNotify;
    });

    console.log(`Found ${tasksToNotify.length} tasks to notify (deadline in ~1 hour)`);

    let sentCount = 0;
    let errorCount = 0;

    // Wyślij powiadomienia dla każdego użytkownika
    for (const task of tasksToNotify) {
      console.log(`Processing task ${task.id} for user ${task.userId}`);
      console.log(`User has ${task.user.pushSubscriptions.length} push subscriptions`);
      
      if (task.user.pushSubscriptions.length === 0) {
        console.log(`Skipping task ${task.id} - user has no push subscriptions`);
        continue;
      }

      // Oblicz deadline dla wyświetlenia w powiadomieniu
      // TypeScript guard - wiemy że deadline nie jest null (przefiltrowane wcześniej)
      if (!task.deadline) continue;
      
      let deadlineDate = parseISO(task.deadline);
      if (task.deadlineTime) {
        const [hours, minutes] = task.deadlineTime.split(':').map(Number);
        deadlineDate = new Date(deadlineDate);
        deadlineDate.setHours(hours, minutes, 0, 0);
      } else {
        deadlineDate = new Date(deadlineDate);
        deadlineDate.setHours(23, 59, 59, 999);
      }
      
      const minutesUntilDeadline = differenceInMinutes(deadlineDate, now);
      const hoursUntilDeadline = Math.floor(minutesUntilDeadline / 60);
      const remainingMinutes = minutesUntilDeadline % 60;
      
      let timeText = '';
      if (hoursUntilDeadline > 0) {
        timeText = ` za ${hoursUntilDeadline} ${hoursUntilDeadline === 1 ? 'godzinę' : 'godziny'}`;
        if (remainingMinutes > 0) {
          timeText += ` i ${remainingMinutes} ${remainingMinutes === 1 ? 'minutę' : 'minut'}`;
        }
      } else {
        timeText = ` za ${remainingMinutes} ${remainingMinutes === 1 ? 'minutę' : 'minut'}`;
      }
      
      const taskTime = task.deadlineTime 
        ? ` o ${task.deadlineTime}` 
        : '';
      
      const priorityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🔴',
      }[task.priority] || '📋';

      const notification = {
        title: `${priorityEmoji} Deadline${timeText}${taskTime}`,
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
      let notificationSent = false;
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
          notificationSent = true;
        } catch (error: any) {
          console.error('Error sending notification:', error);
          console.error('Error details:', {
            statusCode: error.statusCode,
            message: error.message,
            endpoint: subscription.endpoint.substring(0, 50) + '...',
          });
          
          // Jeśli subskrypcja jest nieprawidłowa, usuń ją
          // 410 = Gone (subskrypcja wygasła)
          // 404 = Not Found (subskrypcja nie istnieje)
          // 401 = Unauthorized (nieprawidłowe VAPID keys lub subskrypcja)
          if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 401) {
            console.log(`Removing invalid subscription ${subscription.id} (status: ${error.statusCode})`);
            try {
              await prisma.pushSubscription.delete({
                where: { id: subscription.id },
              });
              console.log(`Subscription ${subscription.id} removed successfully`);
            } catch (deleteError) {
              console.error(`Failed to delete subscription ${subscription.id}:`, deleteError);
            }
          }
          
          errorCount++;
        }
      }
      
      // Oznacz zadanie jako mające wysłane powiadomienie, jeśli udało się wysłać do przynajmniej jednej subskrypcji
      if (notificationSent) {
        try {
          await prisma.assignedTask.update({
            where: { id: task.id },
            data: { notificationSentAt: now },
          });
          console.log(`Marked task ${task.id} as notification sent`);
        } catch (updateError) {
          console.error(`Failed to update notificationSentAt for task ${task.id}:`, updateError);
        }
      }
    }

    const result = {
      success: true,
      tasksFound: tasksToNotify.length,
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

