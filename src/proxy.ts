import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDefaultPathAfterAuth } from './lib/auth-redirect';
import { decryptSessionString } from './lib/session';

function redirectToAuth(request: NextRequest, returnPath: string) {
  const authUrl = new URL('/auth', request.url);
  authUrl.searchParams.set('redirect', returnPath);
  return NextResponse.redirect(authUrl);
}

function redirectForRole(session: NonNullable<ReturnType<typeof decryptSessionString>>) {
  return getDefaultPathAfterAuth({
    role: session.role,
    onboarded: session.onboarded,
  });
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const returnPath = `${pathname}${search}`;

  const sessionCookie = request.cookies.get('astrolink_session')?.value;
  const session = sessionCookie ? decryptSessionString(sessionCookie) : null;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', returnPath);

  const isDashboard = pathname.startsWith('/dashboard');
  const isBooking = pathname.startsWith('/booking');
  const isSession = pathname.startsWith('/session');
  const isOnboard = pathname.startsWith('/onboard');
  const isAuth = pathname === '/auth';

  if (isAuth && session) {
    return NextResponse.redirect(new URL(redirectForRole(session), request.url));
  }

  if (isDashboard || isBooking || isSession || isOnboard) {
    if (!session) {
      return redirectToAuth(request, returnPath);
    }

    if (pathname.startsWith('/dashboard/mentor') && session.role !== 'mentor') {
      const fallback = session.role === 'admin' ? '/dashboard/admin' : '/dashboard/mentee';
      return NextResponse.redirect(new URL(fallback, request.url));
    }

    if (pathname.startsWith('/dashboard/mentee') && session.role !== 'mentee') {
      const fallback = session.role === 'admin' ? '/dashboard/admin' : '/dashboard/mentor';
      return NextResponse.redirect(new URL(fallback, request.url));
    }

    if (pathname.startsWith('/dashboard/admin') && session.role !== 'admin') {
      const fallback = session.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee';
      return NextResponse.redirect(new URL(fallback, request.url));
    }

    if (isOnboard && session.role !== 'mentor') {
      const fallback = session.role === 'admin' ? '/dashboard/admin' : '/dashboard/mentee';
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/booking/:path*',
    '/session/:path*',
    '/onboard/:path*',
    '/auth',
  ],
};
