import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
import { getAdminWaitlistMetrics } from '@/lib/admin-waitlist-metrics';

export async function GET() {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  try {
    const waitlist = await getAdminWaitlistMetrics();
    return NextResponse.json({
      success: true,
      waitlist,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Metrics failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
