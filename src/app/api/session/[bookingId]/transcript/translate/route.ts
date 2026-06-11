import { NextResponse } from 'next/server';

import {
  getCachedTranscriptTranslation,
  setCachedTranscriptTranslation,
  translateTranscriptUtterances,
} from '@/lib/transcript-translation/batch-translate';
import { mapSpeakersToRoles } from '@/lib/transcript-translation/map-speakers';
import {
  isSupportedTargetLocale,
  shouldSkipTranslation,
  type SupportedTargetLocale,
  type TranscriptUtterance,
} from '@/lib/transcript-translation/types';
import type { Json } from '@/lib/database.types';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

type TranslateTranscriptBody = {
  targetLocale?: string;
};

function utterancesFromJson(value: Json | null): TranscriptUtterance[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as unknown as TranscriptUtterance[];
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = await context.params;

  let body: TranslateTranscriptBody = {};
  try {
    body = (await request.json()) as TranslateTranscriptBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const requestedLocale = body.targetLocale?.trim();
  if (!requestedLocale || !isSupportedTargetLocale(requestedLocale)) {
    return NextResponse.json({ error: 'targetLocale is required' }, { status: 400 });
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

  const cached = getCachedTranscriptTranslation(bookingId, requestedLocale);
  if (cached) {
    return NextResponse.json({
      bookingId,
      targetLocale: requestedLocale,
      utterances: cached,
      cacheHit: true,
    });
  }

  const { data: transcriptRow, error: transcriptError } = await supabaseAdmin
    .from('session_transcripts')
    .select('utterances_json, source_locale')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (transcriptError) {
    return NextResponse.json({ error: transcriptError.message }, { status: 500 });
  }
  if (!transcriptRow) {
    return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
  }

  const sourceLocale = transcriptRow.source_locale?.trim() || 'en';
  const targetLocale = requestedLocale as SupportedTargetLocale;

  const [mentorProfile, menteeProfile] = await Promise.all([
    supabaseAdmin.from('mentors').select('full_name').eq('id', booking.mentor_id).maybeSingle(),
    supabaseAdmin.from('users').select('full_name').eq('id', booking.mentee_id).maybeSingle(),
  ]);

  const canonical = mapSpeakersToRoles(utterancesFromJson(transcriptRow.utterances_json), {
    mentorUserId: booking.mentor_id,
    menteeUserId: booking.mentee_id,
    mentorDisplayName: mentorProfile.data?.full_name ?? null,
    menteeDisplayName: menteeProfile.data?.full_name ?? null,
  });

  if (shouldSkipTranslation(sourceLocale, targetLocale)) {
    return NextResponse.json({
      bookingId,
      targetLocale,
      utterances: canonical,
      cacheHit: false,
      skipped: true,
    });
  }

  const translated = await translateTranscriptUtterances({
    bookingId,
    utterances: canonical,
    sourceLocale,
    targetLocale,
    rateLimitKey: booking.mentee_id,
  });

  setCachedTranscriptTranslation(bookingId, targetLocale, translated);

  return NextResponse.json({
    bookingId,
    targetLocale,
    utterances: translated,
    cacheHit: false,
  });
}
