import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSessionString } from './lib/session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Read session cookie directly from the request header
  const sessionCookie = request.cookies.get('astrolink_session')?.value;
  const session = sessionCookie ? decryptSessionString(sessionCookie) : null;

  // Boundaries to protect
  const isDashboard = pathname.startsWith('/dashboard');
  const isBooking = pathname.startsWith('/booking');
  const isSession = pathname.startsWith('/session');

  if (isDashboard || isBooking || isSession) {
    // 1. Not logged in: redirect to /auth
    if (!session) {
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(authUrl);
    }

    // 2. Logged in: check dashboard role matches
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/booking/:path*',
    '/session/:path*',
  ],
};
