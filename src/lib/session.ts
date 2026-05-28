import 'server-only';
import { cookies } from 'next/headers';
import { encrypt, decrypt } from './crypto';

export interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
  expiresAt: string;
  onboarded?: boolean;
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

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const encrypted = cookieStore.get('astrolink_session')?.value;
  if (!encrypted) return null;
  return decryptSessionString(encrypted);
}

export function decryptSessionString(encrypted: string): SessionData | null {
  try {
    const decrypted = decrypt(encrypted);
    const data = JSON.parse(decrypted) as SessionData;
    if (new Date(data.expiresAt) < new Date()) {
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('astrolink_session');
}
