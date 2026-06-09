import { NextResponse } from 'next/server';
import { completeSupabaseAuthCallback } from '@/lib/supabase-auth';
import { getSiteUrl } from '@/lib/site-url';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect');
  const authError = requestUrl.searchParams.get('error_description');

  if (authError) {
    const authUrl = new URL('/auth', getSiteUrl());
    authUrl.searchParams.set('error', authError);
    return NextResponse.redirect(authUrl);
  }

  if (!code) {
    const authUrl = new URL('/auth', getSiteUrl());
    authUrl.searchParams.set('error', 'Missing confirmation code.');
    return NextResponse.redirect(authUrl);
  }

  const result = await completeSupabaseAuthCallback({ code, redirect });

  if (!result.ok) {
    const authUrl = new URL('/auth', getSiteUrl());
    authUrl.searchParams.set('error', result.message);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.redirect(new URL(result.redirectTo, getSiteUrl()));
}
