import { type NextRequest, NextResponse } from 'next/server';
import { getDefaultPathAfterAuth, getSafeRedirectPath } from '@/lib/auth-redirect';
import {
  needsProfileCompletion,
  resolveAppSessionFromAuthUser,
} from '@/lib/resolve-app-session';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const safeNext = getSafeRedirectPath(nextParam, '/dashboard/mentee');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  if (needsProfileCompletion(user)) {
    return NextResponse.redirect(
      `${origin}/auth/complete-profile?redirect=${encodeURIComponent(safeNext)}`,
    );
  }

  const session = await resolveAppSessionFromAuthUser(user);
  const destination = getSafeRedirectPath(
    nextParam,
    session ? getDefaultPathAfterAuth(session) : '/dashboard/mentee',
  );

  return NextResponse.redirect(`${origin}${destination}`);
}