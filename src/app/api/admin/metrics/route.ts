import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
import { getAdminChrisCampaignMetrics } from '@/lib/chris-campaign/admin-chris-campaign-metrics';
import {
  getAdminWaitlistMetrics,
  getAdminWaitlistSignups,
} from '@/lib/waitlist/admin-waitlist-metrics';

export async function GET() {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  try {
    const [waitlist, signups, chrisCampaign] = await Promise.all([
      getAdminWaitlistMetrics(),
      getAdminWaitlistSignups(),
      getAdminChrisCampaignMetrics(),
    ]);
    return NextResponse.json({
      success: true,
      waitlist,
      signups,
      chrisCampaign,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Metrics failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

