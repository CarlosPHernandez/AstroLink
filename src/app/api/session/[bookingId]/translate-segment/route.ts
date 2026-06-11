import { NextResponse } from 'next/server';

import { isLlmRateLimitError } from '@/lib/llm-rate-limit';
import { TranslationAgent } from '@/services/agents/translation-agent';
import { TranslateSegmentError } from '@/lib/transcript-translation/translate-segment';
import {
  isSupportedTargetLocale,
  type SupportedTargetLocale,
} from '@/lib/transcript-translation/types';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

type TranslateSegmentBody = {
  segmentId?: string;
  text?: string;
  sourceLocale?: string;
  targetLocale?: string;
};

function resolveServerTargetLocale(params: {
  sessionUserId: string;
  sessionRole: string;
  menteeId: string;
  menteePreferredLocale: SupportedTargetLocale;
}): SupportedTargetLocale {
  if (params.sessionUserId === params.menteeId) {
    return params.menteePreferredLocale;
  }
  return 'en';
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = await context.params;

  let body: TranslateSegmentBody;
  try {
    body = (await request.json()) as TranslateSegmentBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const segmentId = body.segmentId?.trim();
  const text = body.text?.trim();
  if (!segmentId || !text) {
    return NextResponse.json({ error: 'segmentId and text are required' }, { status: 400 });
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, mentee_id, mentor_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const isParticipant =
    session.userId === booking.mentee_id ||
    session.userId === booking.mentor_id ||
    session.role === 'admin';

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: menteeProfile } = await supabaseAdmin
    .from('users')
    .select('preferred_locale')
    .eq('id', booking.mentee_id)
    .maybeSingle();

  const menteePreferredLocale: SupportedTargetLocale =
    menteeProfile?.preferred_locale && isSupportedTargetLocale(menteeProfile.preferred_locale)
      ? menteeProfile.preferred_locale
      : 'en';

  const serverTargetLocale = resolveServerTargetLocale({
    sessionUserId: session.userId,
    sessionRole: session.role,
    menteeId: booking.mentee_id,
    menteePreferredLocale,
  });

  const requestedLocale = body.targetLocale?.trim();
  if (requestedLocale && requestedLocale !== serverTargetLocale) {
    return NextResponse.json({ error: 'targetLocale mismatch' }, { status: 400 });
  }

  const sourceLocale = body.sourceLocale?.trim() || 'en';
  const started = Date.now();

  try {
    const agent = new TranslationAgent();
    const result = await agent.translateSegment({
      bookingId,
      segmentId,
      text,
      sourceLocale,
      targetLocale: serverTargetLocale,
      rateLimitKey: booking.mentee_id,
    });

    return NextResponse.json({
      ...result,
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    if (error instanceof TranslateSegmentError) {
      const status =
        error.code === 'text_too_short' || error.code === 'budget_exceeded' ? 400 : 422;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    if (isLlmRateLimitError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'rate_limited',
          retryAfterMs: error.retryAfterMs,
        },
        { status: 429 },
      );
    }
    const message = error instanceof Error ? error.message : 'Translation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
