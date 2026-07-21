import 'server-only';

import { getSession, type SessionData } from '@/lib/session';

export type MentorSessionGate =
  | { ok: true; session: SessionData }
  | { ok: false; message: string };

/**
 * Mentor mutations that require finished activation wizard.
 * Proxy redirects are UX only — always use this (or requireMentorSession) on mutations.
 */
export async function requireActivatedMentor(): Promise<MentorSessionGate> {
  const session = await getSession();
  if (!session || session.role !== 'mentor') {
    return { ok: false, message: 'You must be signed in as a mentor.' };
  }
  if (session.activationStatus === 'pending') {
    return {
      ok: false,
      message: 'Finish expert activation before using the dashboard.',
    };
  }
  return { ok: true, session };
}

/** Mentor session allowed during /activate/setup (pending or active). */
export async function requireMentorSession(): Promise<MentorSessionGate> {
  const session = await getSession();
  if (!session || session.role !== 'mentor') {
    return { ok: false, message: 'You must be signed in as a mentor.' };
  }
  return { ok: true, session };
}
