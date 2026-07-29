import { NextResponse } from 'next/server';
import { VideoRequestAgent } from '@/services/agents/video-request-agent';

/**
 * Expire overdue paid_awaiting_expert requests and refund.
 * Secure with CRON_SECRET header: Authorization: Bearer $CRON_SECRET
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const agent = new VideoRequestAgent();
  const count = await agent.expireOverdue();
  return NextResponse.json({ expired: count });
}
