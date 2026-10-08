import 'server-only';

import { randomUUID } from 'crypto';
import { clerkClient } from '@clerk/nextjs/server';
import type { User } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import {
  resolveAppSessionFromAuthUser,
  resolvePublicUserIdForAuthUser,
} from '@/lib/resolve-app-session';
import type { SessionData } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

const NIL_AUTH_ID = '00000000-0000-4000-8000-000000000000';

type ClerkHeaderSource = {
  url: string;
  headerEntries: Iterable<[string, string]>;
  cookieHeader?: string | null;
};

export function clerkDisplayName(user: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): string {
  const combined = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const name = user.fullName?.trim() || combined || user.username?.trim() || '';
  return name;
}

/**
 * Clerk user ids are not UUIDs. Never write them into public.users.id.
 * Reuse the existing row when the email already has an AstroLink account.
 */
export function accountIdForClerkIdentity(existingPublicUserId: string | null): string {
  if (existingPublicUserId && existingPublicUserId !== NIL_AUTH_ID) {
    return existingPublicUserId;
  }
  return randomUUID();
}

function requestForClerk(source: ClerkHeaderSource): Request {
  const requestHeaders = new Headers();
  for (const [key, value] of source.headerEntries) {
    if (key.toLowerCase() === 'cookie') {
      continue;
    }
    requestHeaders.set(key, value);
  }
  if (source.cookieHeader) {
    requestHeaders.set('cookie', source.cookieHeader);
  }
  return new Request(source.url, { headers: requestHeaders });
}

async function clerkIdentityFromRequest(
  source: ClerkHeaderSource,
): Promise<{ email: string; fullName: string } | null> {
  const client = await clerkClient();
  const state = await client.authenticateRequest(requestForClerk(source), {
    acceptsToken: 'session_token',
  });
  const userId = state.toAuth()?.userId;
  if (!userId) {
    return null;
  }

  const user = await client.users.getUser(userId);
  const email =
    user.emailAddresses
      .find((entry) => entry.id === user.primaryEmailAddressId)
      ?.emailAddress.trim()
      .toLowerCase() ?? '';
  if (!email) {
    return null;
  }

  const fullName =
    clerkDisplayName({
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
    }) ||
    email.split('@')[0] ||
    'AstroLink User';

  return { email, fullName };
}

export function clerkHeaderSourceFromRequest(request: {
  url: string;
  headers: Headers;
  cookies: { getAll(): { name: string; value: string }[] };
}): ClerkHeaderSource {
  const cookieHeader = request.cookies
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
  return {
    url: request.url,
    headerEntries: request.headers.entries(),
    cookieHeader,
  };
}

export async function resolveClerkAppSession(
  source?: ClerkHeaderSource,
): Promise<SessionData | null> {
  try {
    const identity = await clerkIdentityFromRequest(source ?? (await clerkSourceFromNextHeaders()));
    if (!identity) {
      return null;
    }

    const existingId = await resolvePublicUserIdForAuthUser({
      authUserId: NIL_AUTH_ID,
      email: identity.email,
    });
    const accountId = accountIdForClerkIdentity(existingId);

    const session = await resolveAppSessionFromAuthUser({
      id: accountId,
      email: identity.email,
      user_metadata: { full_name: identity.fullName },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '',
    } as User);

    if (session?.role === 'mentee') {
      await ensureMenteeAppState(session.userId);
    }

    return session;
  } catch (error) {
    console.error(
      'resolveClerkAppSession:',
      error instanceof Error ? error.message.split('\n')[0] : 'unknown error',
    );
    return null;
  }
}

async function clerkSourceFromNextHeaders(): Promise<ClerkHeaderSource> {
  const headerStore = await headers();
  return {
    url: 'https://astro-link.space/',
    headerEntries: headerStore.entries(),
    cookieHeader: headerStore.get('cookie'),
  };
}

async function ensureMenteeAppState(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('user_app_state').insert({
    user_id: userId,
    role: 'mentee',
    onboarded: true,
  });

  if (error && error.code !== '23505') {
    console.error('ensureMenteeAppState:', error.message);
  }
}

/** Ends the Clerk browser session so the AstroLink bridge does not sign the user back in. */
export async function revokeClerkSession(): Promise<boolean> {
  try {
    const source = await clerkSourceFromNextHeaders();
    const client = await clerkClient();
    const state = await client.authenticateRequest(requestForClerk(source), {
      acceptsToken: 'session_token',
    });
    const sessionId = state.toAuth()?.sessionId;
    if (!sessionId) {
      return false;
    }
    await client.sessions.revokeSession(sessionId);
    return true;
  } catch (error) {
    console.error(
      'revokeClerkSession:',
      error instanceof Error ? error.message.split('\n')[0] : 'unknown error',
    );
    return false;
  }
}
