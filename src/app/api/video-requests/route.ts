import { NextResponse } from 'next/server';
import { z } from 'zod';
import { VIDEO_REQUEST_OCCASIONS } from '@/lib/video-requests/types';
import { VideoRequestAgent } from '@/services/agents/video-request-agent';

const bodySchema = z.object({
  mentorSlug: z.string().min(1).max(120),
  buyerEmail: z.string().email().max(320),
  fromName: z.string().min(1).max(120),
  recipientName: z.string().max(120).optional().nullable(),
  occasion: z.enum(VIDEO_REQUEST_OCCASIONS),
  instructions: z.string().min(12).max(1200),
  pronunciationNotes: z.string().max(400).optional().nullable(),
  marketingReferrer: z.string().max(120).optional().nullable(),
});

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, max = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (!rateLimit(`vr:${ip}`)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 },
    );
  }

  if (!rateLimit(`vr-email:${parsed.data.buyerEmail.toLowerCase()}`, 5, 3_600_000)) {
    return NextResponse.json({ error: 'Too many requests for this email.' }, { status: 429 });
  }

  try {
    const agent = new VideoRequestAgent();
    const result = await agent.createGuestRequest(parsed.data);
    return NextResponse.json({
      videoRequestId: result.videoRequestId,
      clientSecret: result.clientSecret,
      amountCents: result.amountCents,
      skipStripe: result.skipStripe,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create request';
    const status = /not found|not available|Invalid|required|must be/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
