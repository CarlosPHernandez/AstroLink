import 'server-only';
import { NextResponse } from 'next/server';
import { getSession, type SessionData } from '@/lib/session';

export async function requireApiSession(): Promise<
  SessionData | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
  return session;
}

export async function requireApiRole(
  role: SessionData['role'],
): Promise<SessionData | NextResponse> {
  const sessionOrResponse = await requireApiSession();
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }
  if (sessionOrResponse.role !== role) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 },
    );
  }
  return sessionOrResponse;
}
