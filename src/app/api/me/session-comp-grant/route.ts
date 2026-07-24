import { NextResponse } from 'next/server';

import {
  formatGrantExpiryLabel,
  getAvailableGrantForUser,
} from '@/lib/session-comp-grants';
import { getSession } from '@/lib/session';

/**
 * Active complimentary session grant for the signed-in mentee (if any).
 * GET /api/me/session-comp-grant
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'mentee' && session.role !== 'admin') {
    return NextResponse.json({ available: false });
  }

  try {
    const grant = await getAvailableGrantForUser(session.userId);
    if (!grant) {
      return NextResponse.json({ available: false });
    }
    return NextResponse.json({
      available: true,
      grantId: grant.id,
      creditMinutes: grant.creditMinutes,
      expiresAt: grant.expiresAt,
      expiresLabel: formatGrantExpiryLabel(grant.expiresAt),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
