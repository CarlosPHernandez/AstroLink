import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  listedExpertToRelay,
  pickLandingRelayExpert,
  type LandingRelayExpert,
} from '@/lib/landing/featured-expert';
import {
  buildFallbackRelayMessages,
  buildRelayMessagesFromTeaser,
  normalizeLandingGoal,
  type LandingRelayReplySource,
} from '@/lib/landing/hero-relay';
import {
  generateLandingRelayTeaser,
  isLandingRelayLlmEnabled,
} from '@/lib/landing/hero-relay-llm';
import { hashClientIp } from '@/lib/landing/hash-ip';
import { getLandingRelayCache, setLandingRelayCache } from '@/lib/landing/relay-cache';
import {
  assertLandingRelaySubmitRateLimit,
  getLandingRelayClientIp,
  isLandingRelayRateLimitError,
  tryConsumeLandingRelayLlmBudget,
} from '@/lib/landing/relay-rate-limit';
import { insertLandingGoalSubmission } from '@/lib/landing/persist-goal-submission';
import { listPublicMentors } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

const BodySchema = z.object({
  goal: z.string().min(1).max(400),
  expertSlug: z.string().max(120).optional(),
  /** Honeypot — real UI never fills this. */
  website: z.string().max(200).optional(),
});

function jsonResponse(body: {
  expert: LandingRelayExpert;
  messages: ReturnType<typeof buildFallbackRelayMessages>;
  source: LandingRelayReplySource;
  submissionId: string | null;
}) {
  return NextResponse.json(body);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const goal = normalizeLandingGoal(parsed.data.goal);
  if (!goal) {
    return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields — soft 200 with no side effects
  if (parsed.data.website?.trim()) {
    const experts = await listPublicMentors();
    const expert = pickLandingRelayExpert(goal, experts);
    return jsonResponse({
      expert,
      messages: buildFallbackRelayMessages(goal, expert),
      source: 'fallback',
      submissionId: null,
    });
  }

  const ip = getLandingRelayClientIp(request);
  try {
    assertLandingRelaySubmitRateLimit(ip);
  } catch (error) {
    if (isLandingRelayRateLimitError(error)) {
      const experts = await listPublicMentors();
      const expert = pickLandingRelayExpert(goal, experts);
      // No DB write when hard-abused (protect table size)
      return jsonResponse({
        expert,
        messages: buildFallbackRelayMessages(goal, expert),
        source: 'fallback',
        submissionId: null,
      });
    }
    throw error;
  }

  const experts = await listPublicMentors();
  const hintedSlug = parsed.data.expertSlug?.trim();
  const hinted = hintedSlug ? experts.find((e) => e.slug === hintedSlug) : undefined;
  const expert = hinted
    ? listedExpertToRelay(hinted)
    : pickLandingRelayExpert(goal, experts);

  let source: LandingRelayReplySource = 'fallback';
  let teaser: string | null = null;
  let cta: string | null = null;

  const cached = getLandingRelayCache(goal, expert.slug);
  if (cached) {
    teaser = cached.teaser;
    cta = cached.cta;
    source = 'cache';
  } else if (isLandingRelayLlmEnabled() && tryConsumeLandingRelayLlmBudget(ip)) {
    const generated = await generateLandingRelayTeaser({ goal, expert });
    if (generated) {
      teaser = generated.teaser;
      cta = generated.cta;
      source = 'llm';
      setLandingRelayCache(goal, expert.slug, teaser, cta);
    }
  }

  const messages =
    teaser && cta
      ? buildRelayMessagesFromTeaser(goal, teaser, cta)
      : buildFallbackRelayMessages(goal, expert);

  if (!teaser || !cta) {
    source = 'fallback';
  }

  const session = await getSession();
  const userAgent = request.headers.get('user-agent')?.slice(0, 400) ?? null;

  const submissionId = await insertLandingGoalSubmission({
    goalText: goal,
    expertSlug: expert.slug,
    expertName: expert.name,
    replySource: source,
    ipHash: hashClientIp(ip),
    userAgent,
    userId: session?.userId ?? null,
  });

  return jsonResponse({
    expert,
    messages,
    source,
    submissionId,
  });
}
