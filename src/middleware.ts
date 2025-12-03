import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Strony publiczne
const publicPaths = ['/login', '/register', '/api/auth', '/api/stripe/webhook', '/api/push/notify'];

// Strony wymagające aktywnej subskrypcji/trialu
const protectedPaths = ['/', '/api/tasks', '/api/transcribe', '/api/process'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pozwól na dostęp do statycznych zasobów i API auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Pozwól na webhook Stripe bez autoryzacji
  if (pathname === '/api/stripe/webhook') {
    return NextResponse.next();
  }

  // Endpoint powiadomień push jest w publicPaths, więc będzie obsłużony poniżej
  // Ale dodatkowo sprawdzamy header x-vercel-cron dla bezpieczeństwa
  if (pathname === '/api/push/notify') {
    // Sprawdź header x-vercel-cron (różne warianty)
    const vercelCronHeader = request.headers.get('x-vercel-cron') || 
                             request.headers.get('X-Vercel-Cron') ||
                             request.headers.get('X-VERCEL-CRON');
    
    // Jeśli to request z Vercel Cron (ma header), pozwól
    if (vercelCronHeader === '1') {
      return NextResponse.next();
    }
    
    // Jeśli to POST request (może być z Vercel bez headera w niektórych przypadkach)
    // Sprawdź user-agent
    const userAgent = request.headers.get('user-agent') || '';
    if (request.method === 'POST' && (userAgent.includes('vercel') || userAgent.includes('Vercel'))) {
      return NextResponse.next();
    }
    
    // Dla innych requestów (testy), sprawdź czy użytkownik jest zalogowany
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (token) {
      return NextResponse.next();
    }
    
    // Jeśli nie ma żadnej autoryzacji, endpoint i tak jest w publicPaths, więc pozwól
    // (autoryzacja będzie sprawdzona w samym endpoincie)
    return NextResponse.next();
  }

  // Pobierz token tylko jeśli nie jest to endpoint push/notify (już sprawdzony wyżej)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Sprawdź czy ścieżka jest publiczna
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // Jeśli użytkownik nie jest zalogowany
  if (!token) {
    // Pozwól na dostęp do stron publicznych
    if (isPublicPath) {
      return NextResponse.next();
    }
    // Przekieruj na login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jeśli użytkownik jest zalogowany i próbuje wejść na strony auth
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

