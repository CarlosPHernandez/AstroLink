import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
import {
  getAdminWaitlistMetrics,
  getAdminWaitlistSignups,
} from '@/lib/admin-waitlist-metrics';

export async function GET() {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  try {
    const [waitlist, signups] = await Promise.all([
      getAdminWaitlistMetrics(),
      getAdminWaitlistSignups(),
    ]);
    return NextResponse.json({
      success: true,
      waitlist,
      signups,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Metrics failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

