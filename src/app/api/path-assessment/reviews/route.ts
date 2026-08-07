import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PathAssessmentReviewAgent } from '@/services/agents/path-assessment-review-agent';

export const runtime = 'nodejs';

const bodySchema = z.object({
  assessmentToken: z.string().min(32).max(80),
  mentorSlug: z.string().min(1).max(120),
  buyerEmail: z.string().email().max(320).optional(),
  buyerName: z.string().max(120).optional().nullable(),
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

  if (!rateLimit(`par:${ip}`)) {
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

  try {
    const agent = new PathAssessmentReviewAgent();
    const result = await agent.createGuestReview(parsed.data);
    return NextResponse.json({
      success: true,
      reviewId: result.reviewId,
      publicToken: result.publicToken,
      clientSecret: result.clientSecret,
      amountCents: result.amountCents,
      skipStripe: result.skipStripe,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create review';
    const status = /not found|not available|Invalid|required|not ready/i.test(message)
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
