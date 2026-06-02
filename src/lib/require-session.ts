import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { toAuthWithRedirect } from '@/lib/auth-redirect';
import { getSession, type SessionData } from '@/lib/session';

async function getRequestPathForRedirect(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get('x-pathname') ?? '';
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    redirect(toAuthWithRedirect(await getRequestPathForRedirect()));
  }
  return session;
}

export async function requireRole(
  ...roles: SessionData['role'][]
): Promise<SessionData> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    if (session.role === 'admin') {
      redirect('/dashboard/admin');
    }
    if (session.role === 'mentor') {
      redirect('/dashboard/mentor');
    }
    redirect('/dashboard/mentee');
  }
  return session;
}
