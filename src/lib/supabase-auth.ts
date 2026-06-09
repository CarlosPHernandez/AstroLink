import 'server-only';

import type { User } from '@supabase/supabase-js';
import {
  getDefaultPathAfterAuth,
  getSafeRedirectPath,
} from '@/lib/auth-redirect';
import { createSupabaseServerAuthClient } from '@/lib/supabase/server-auth';
import { getSiteUrl } from '@/lib/site-url';
import { createSession } from '@/lib/session';
import { ensureMenteeUserRow } from '@/lib/user-profile';

export type SupabaseAuthResult =
  | { ok: true; needsEmailConfirmation: false; redirectTo: string }
  | { ok: true; needsEmailConfirmation: true; message: string }
  | { ok: false; message: string };

function fullNameFromUser(user: User, fallbackEmail: string): string {
  const metadataName = user.user_metadata?.full_name;
  if (typeof metadataName === 'string' && metadataName.trim().length >= 2) {
    return metadataName.trim();
  }
  const prefix = fallbackEmail.split('@')[0] ?? 'User';
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

async function establishMenteeSession(user: User, fullName: string): Promise<void> {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    throw new Error('Account email is missing.');
  }

  const userId = await ensureMenteeUserRow({
    userId: user.id,
    email,
    fullName,
  });

  await createSession({
    userId,
    email,
    role: 'mentee',
    fullName,
    onboarded: true,
  });
}

function resolveRedirect(formData: FormData): string {
  const redirectParam = formData.get('redirect');
  const fallback = getDefaultPathAfterAuth({ role: 'mentee', onboarded: true });
  return getSafeRedirectPath(redirectParam?.toString(), fallback);
}

function buildEmailRedirectTo(formData: FormData): string {
  const redirect = resolveRedirect(formData);
  const callback = new URL('/auth/callback', getSiteUrl());
  callback.searchParams.set('redirect', redirect);
  return callback.toString();
}

export async function signUpMenteeWithSupabase(params: {
  fullName: string;
  email: string;
  password: string;
  formData: FormData;
}): Promise<SupabaseAuthResult> {
  const supabase = await createSupabaseServerAuthClient();
  const email = params.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        role: 'mentee',
      },
      emailRedirectTo: buildEmailRedirectTo(params.formData),
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data.user) {
    return { ok: false, message: 'Could not create account. Please try again.' };
  }

  const fullName = params.fullName.trim();
  await ensureMenteeUserRow({
    userId: data.user.id,
    email,
    fullName,
  });

  if (!data.session) {
    return {
      ok: true,
      needsEmailConfirmation: true,
      message:
        'Check your email to confirm your account, then sign in from this page.',
    };
  }

  await establishMenteeSession(data.user, fullName);

  return {
    ok: true,
    needsEmailConfirmation: false,
    redirectTo: resolveRedirect(params.formData),
  };
}

export async function signInMenteeWithSupabase(params: {
  email: string;
  password: string;
  formData: FormData;
}): Promise<SupabaseAuthResult> {
  const supabase = await createSupabaseServerAuthClient();
  const email = params.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: params.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data.user) {
    return { ok: false, message: 'Sign-in failed. Please try again.' };
  }

  const metadataRole = data.user.user_metadata?.role;
  if (metadataRole && metadataRole !== 'mentee') {
    await supabase.auth.signOut();
    return {
      ok: false,
      message: 'Expert sign-in is not available yet. Contact support if you need access.',
    };
  }

  const fullName = fullNameFromUser(data.user, email);
  await establishMenteeSession(data.user, fullName);

  return {
    ok: true,
    needsEmailConfirmation: false,
    redirectTo: resolveRedirect(params.formData),
  };
}

export async function completeSupabaseAuthCallback(params: {
  code: string;
  redirect: string | null;
}): Promise<{ ok: true; redirectTo: string } | { ok: false; message: string }> {
  const supabase = await createSupabaseServerAuthClient();
  const { error } = await supabase.auth.exchangeCodeForSession(params.code);

  if (error) {
    return { ok: false, message: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, message: 'Could not load your account after confirmation.' };
  }

  const email = user.email.trim().toLowerCase();
  const fullName = fullNameFromUser(user, email);
  await establishMenteeSession(user, fullName);

  const fallback = getDefaultPathAfterAuth({ role: 'mentee', onboarded: true });
  return {
    ok: true,
    redirectTo: getSafeRedirectPath(params.redirect, fallback),
  };
}

export async function signOutSupabaseIfConfigured(): Promise<void> {
  try {
    const supabase = await createSupabaseServerAuthClient();
    await supabase.auth.signOut();
  } catch {
    // Demo-only deployments may not configure Supabase auth env.
  }
}
