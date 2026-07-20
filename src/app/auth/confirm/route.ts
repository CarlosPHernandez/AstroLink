import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import {
  getSafeRedirectPath,
  isPasswordRecoveryNextPath,
} from '@/lib/auth-redirect';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const nextRaw = searchParams.get('next');
  const next = getSafeRedirectPath(nextRaw, '/dashboard/mentee');

  // PKCE recovery sometimes hits confirm; forward to callback.
  if (code && !tokenHash) {
    const callback = new URL('/auth/callback', origin);
    callback.searchParams.set('code', code);
    if (nextRaw) {
      callback.searchParams.set('next', nextRaw);
    }
    return NextResponse.redirect(callback);
  }

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = isPasswordRecoveryNextPath(next) ? '/auth/update-password' : next;
  redirectTo.search = '';

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = '/auth/auth-code-error';
  return NextResponse.redirect(redirectTo);
}