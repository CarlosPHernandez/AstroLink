import { NextResponse } from 'next/server';

import {
  parseMeetingEndedEvent,
  verifyDailyWebhookSignature,
  type DailyWebhookEvent,
} from '@/lib/daily';
import { fulfillBookingAfterMeetingEnded } from '@/lib/post-session';

export async function POST(request: Request) {
  const hmacSecret = process.env.DAILY_WEBHOOK_HMAC;
  if (!hmacSecret) {
    return NextResponse.json(
      { error: 'DAILY_WEBHOOK_HMAC not configured' },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');
  const timestamp = request.headers.get('x-webhook-timestamp');

  if (
    !verifyDailyWebhookSignature({
      rawBody,
      signatureHeader: signature,
      timestampHeader: timestamp,
      hmacSecretBase64: hmacSecret,
    })
  ) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let body: DailyWebhookEvent;
  try {
    body = JSON.parse(rawBody) as DailyWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const meetingEnded = parseMeetingEndedEvent(body);
    if (!meetingEnded) {
      return NextResponse.json({ received: true, skipped: 'unsupported_event' });
    }

    const result = await fulfillBookingAfterMeetingEnded(meetingEnded);

    return NextResponse.json({ received: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error('Daily webhook error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
