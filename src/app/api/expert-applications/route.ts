import { NextResponse } from 'next/server';
import { submitExpertApplication } from '@/lib/expert-offer/applications';
import { ExpertApplicationSchema } from '@/lib/expert-offer/schema';

/**
 * In-memory cap: 5 POSTs / 10 minutes / client IP.
 * Per server process only — not shared across instances.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_POSTS = 5;
const hitsByIp = new Map<string, number[]>();

export function __resetExpertApplicationRateLimitForTests(): void {
  hitsByIp.clear();
}

function clientIp(request: Request): string {
  const firstHop = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return firstHop || 'unknown';
}

function consumeApplicationPost(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_POSTS) {
    hitsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  if (!consumeApplicationPost(clientIp(request))) {
    return NextResponse.json(
      { success: false, error: 'Too many applications. Try again later.' },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Check the highlighted fields.' },
      { status: 400 },
    );
  }

  const parsed = ExpertApplicationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Check the highlighted fields.' },
      { status: 400 },
    );
  }

  try {
    const result = await submitExpertApplication(parsed.data);
    return NextResponse.json({ success: true }, { status: result.created ? 201 : 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Could not submit. Try again.' },
      { status: 500 },
    );
  }
}
