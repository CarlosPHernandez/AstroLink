import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isDemoAuthEnabled,
  isProtectedAppSurfaceEnabled,
  isSupabaseAuthEnabled,
  isWaitlistMode,
} from './lib/app-mode';
import { getDefaultPathAfterAuth } from './lib/auth-redirect';
import { resolveAppSessionFromAuthUser } from './lib/resolve-app-session';
import { decryptSessionString, type SessionData } from './lib/session';
import { createProxyClient, withSupabaseCookies } from './lib/supabase/proxy-client';
import { resolveWaitlistRoute } from './lib/waitlist/waitlist-routes';

function redirectToAuth(request: NextRequest, returnPath: string) {
  const authUrl = new URL('/auth', request.url);
  authUrl.searchParams.set('redirect', returnPath);
  return NextResponse.redirect(authUrl);
}

function redirectToEarlyAccess(request: NextRequest) {
  return NextResponse.redirect(new URL('/early-access', request.url));
}

function redirectForRole(session: SessionData) {
  return getDefaultPathAfterAuth({
    role: session.role,
    onboarded: session.onboarded,
  });
}

function applyRoleGuards(
  request: NextRequest,
  pathname: string,
  session: SessionData,
): NextResponse | null {
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

  if (pathname.startsWith('/onboard') && session.role !== 'mentor') {
    const fallback = session.role === 'admin' ? '/dashboard/admin' : '/dashboard/mentee';
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  return null;
}

async function resolveSessionForProxy(request: NextRequest): Promise<{
  session: SessionData | null;
  supabaseResponse: NextResponse | null;
}> {
  if (isSupabaseAuthEnabled()) {
    const client = createProxyClient(request);
    const {
      data: { user },
    } = await client.supabase.auth.getUser();
    const session = user ? await resolveAppSessionFromAuthUser(user) : null;
    return { session, supabaseResponse: client.getResponse() };
  }

  if (isDemoAuthEnabled()) {
    const encrypted = request.cookies.get('astrolink_session')?.value;
    const session = encrypted ? decryptSessionString(encrypted) : null;
    return { session, supabaseResponse: null };
  }

  if (!isProtectedAppSurfaceEnabled() && isWaitlistMode()) {
    const encrypted = request.cookies.get('astrolink_session')?.value;
    const session = encrypted ? decryptSessionString(encrypted) : null;
    if (session?.role === 'admin') {
      return { session, supabaseResponse: null };
    }
  }

  return { session: null, supabaseResponse: null };
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const returnPath = `${pathname}${search}`;

  const { session, supabaseResponse } = await resolveSessionForProxy(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', returnPath);

  const isDashboard = pathname.startsWith('/dashboard');
  const isBooking = pathname.startsWith('/booking');
  const isSession = pathname.startsWith('/session');
  const isOnboard = pathname.startsWith('/onboard');
  const isProtectedRoute = isDashboard || isBooking || isSession || isOnboard;
  const isAuthEntry = pathname === '/auth';

  const finish = (response: NextResponse) => {
    if (supabaseResponse) {
      withSupabaseCookies(response, supabaseResponse);
    }
    return response;
  };

  if (!isProtectedAppSurfaceEnabled()) {
    const waitlistDecision = resolveWaitlistRoute(pathname, session);
    if (waitlistDecision.action === 'allow') {
      return finish(
        NextResponse.next({
          request: { headers: requestHeaders },
        }),
      );
    }
    if (waitlistDecision.action === 'api_blocked') {
      return finish(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    }
    return finish(redirectToEarlyAccess(request));
  }

  if (isAuthEntry && session) {
    return finish(NextResponse.redirect(new URL(redirectForRole(session), request.url)));
  }

  if (pathname === '/auth/complete-profile' && !session) {
    return finish(redirectToAuth(request, returnPath));
  }

  if (isProtectedRoute) {
    if (!session) {
      return finish(redirectToAuth(request, returnPath));
    }

    const roleRedirect = applyRoleGuards(request, pathname, session);
    if (roleRedirect) {
      return finish(roleRedirect);
    }
  }

  return finish(
    NextResponse.next({
      request: { headers: requestHeaders },
    }),
  );
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets so waitlist mode can gate /, /experts,
     * and other public marketing pages — not only auth/booking/dashboard paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};