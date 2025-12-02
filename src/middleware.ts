import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Strony publiczne
const publicPaths = ['/login', '/register', '/api/auth', '/api/stripe/webhook'];

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

