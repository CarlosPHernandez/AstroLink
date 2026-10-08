import 'server-only';
import { cookies } from 'next/headers';
import {
  isDemoAuthEnabled,
  isProtectedAppSurfaceEnabled,
  isSupabaseAuthEnabled,
  isWaitlistMode,
} from '@/lib/app-mode';
import { resolveClerkAppSession } from '@/lib/clerk-app-session';
import { resolveAppSessionFromAuthUser } from '@/lib/resolve-app-session';
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from './crypto';

export interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
  expiresAt: string;
  onboarded?: boolean;
  /** Expert claim wizard: pending until /activate/setup is completed. */
  activationStatus?: 'pending' | 'active';
}

export async function createSession(data: Omit<SessionData, 'expiresAt'>) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const payload: SessionData = { ...data, expiresAt };
  const encrypted = encrypt(JSON.stringify(payload));
  const cookieStore = await cookies();
  cookieStore.set('astrolink_session', encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expiresAt),
    sameSite: 'lax',
    path: '/',
  });
}

function sessionAllowedInCurrentMode(session: SessionData): SessionData | null {
  if (!isProtectedAppSurfaceEnabled()) {
    if (isWaitlistMode() && session.role === 'admin') {
      return session;
    }
    return null;
  }
  return session;
}

export async function getSession(): Promise<SessionData | null> {
  if (isSupabaseAuthEnabled()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return resolveAppSessionFromAuthUser(user);
    }
  }

  const clerkSession = await resolveClerkAppSession();
  if (clerkSession) {
    return sessionAllowedInCurrentMode(clerkSession);
  }

  if (isSupabaseAuthEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const encrypted = cookieStore.get('astrolink_session')?.value;
  if (!encrypted) return null;

  const session = decryptSessionString(encrypted);
  if (!session) return null;

  return sessionAllowedInCurrentMode(session);
}

export function decryptSessionString(encrypted: string): SessionData | null {
  try {
    const decrypted = decrypt(encrypted);
    const data = JSON.parse(decrypted) as SessionData;
    if (new Date(data.expiresAt) < new Date()) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  if (isSupabaseAuthEnabled()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return;
  }
  const cookieStore = await cookies();
  cookieStore.delete('astrolink_session');
}

export function isUsingDemoSessionCookie(): boolean {
  return isProtectedAppSurfaceEnabled() && isDemoAuthEnabled();
}
