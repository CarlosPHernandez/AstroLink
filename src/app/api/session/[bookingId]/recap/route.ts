import { NextResponse } from 'next/server';

import {
  localeFallbackChain,
  parsePostSessionOutput,
  parseRecapLocaleQuery,
  resolveEffectiveRecapLocale,
} from '@/lib/transcript-translation/recap-locale';
import { TRANSLATION_AGENT_ID } from '@/lib/transcript-translation/types';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

async function hasTranslationFailureAudit(bookingId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('audit_log')
    .select('id')
    .eq('agent_id', TRANSLATION_AGENT_ID)
    .eq('event', 'RECAP_TRANSLATION_FAILED')
    .eq('ref_id', bookingId)
    .limit(1);

  if (error) {
    return false;
  }

  return Boolean(data?.length);
}

export async function GET(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId } = await context.params;
  const searchParams = new URL(request.url).searchParams;

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, mentee_id, mentor_id, status')
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

  const [menteeProfile, sessionResult] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('preferred_locale')
      .eq('id', booking.mentee_id)
      .maybeSingle(),
    supabaseAdmin
      .from('sessions')
      .select('summary_json, transcript_available, duration_seconds, completed_at')
      .eq('booking_id', bookingId)
      .maybeSingle(),
  ]);

  const menteePreferredLocale = menteeProfile.data?.preferred_locale ?? null;

  const localeParse = parseRecapLocaleQuery(
    searchParams,
    session.role,
    menteePreferredLocale,
  );

  if (!localeParse.ok) {
    return NextResponse.json({ error: localeParse.error }, { status: 400 });
  }

  const requestedLocale = localeParse.locale;

  if (sessionResult.error) {
    return NextResponse.json({ error: sessionResult.error.message }, { status: 500 });
  }

  const sessionRow = sessionResult.data;

  if (!sessionRow) {
    return NextResponse.json({
      bookingId,
      status: booking.status,
      ready: false,
      recap: null,
      transcriptAvailable: false,
      locale: requestedLocale,
      localized: false,
      translationPending: false,
      translationFailed: false,
    });
  }

  const englishRecap = parsePostSessionOutput(sessionRow.summary_json);
  const fallbackChain = localeFallbackChain(requestedLocale);
  const translationLocales = fallbackChain.filter((locale) => locale !== 'en');

  const [translationRows, translationFailed] = await Promise.all([
    translationLocales.length > 0
      ? supabaseAdmin
          .from('session_translations')
          .select('target_locale, summary_json')
          .eq('booking_id', bookingId)
          .in('target_locale', translationLocales)
      : Promise.resolve({ data: [], error: null }),
    requestedLocale !== 'en' && englishRecap
      ? hasTranslationFailureAudit(bookingId)
      : Promise.resolve(false),
  ]);

  if (translationRows.error) {
    return NextResponse.json({ error: translationRows.error.message }, { status: 500 });
  }

  const translationsByLocale = new Map<string, NonNullable<ReturnType<typeof parsePostSessionOutput>>>();
  for (const row of translationRows.data ?? []) {
    const parsed = parsePostSessionOutput(row.summary_json);
    if (parsed) {
      translationsByLocale.set(row.target_locale, parsed);
    }
  }

  const resolved = resolveEffectiveRecapLocale({
    requestedLocale,
    englishRecap,
    translationsByLocale,
  });

  const wantsLocalized = requestedLocale !== 'en';
  const hasRequestedTranslation = translationsByLocale.has(requestedLocale);
  const translationPending =
    Boolean(englishRecap) &&
    wantsLocalized &&
    !hasRequestedTranslation &&
    !translationFailed &&
    resolved.effectiveLocale === 'en' &&
    !resolved.localized;

  return NextResponse.json({
    bookingId,
    status: booking.status,
    ready: resolved.recap !== null,
    recap: resolved.recap,
    transcriptAvailable: sessionRow.transcript_available,
    durationSeconds: sessionRow.duration_seconds,
    completedAt: sessionRow.completed_at,
    locale: resolved.effectiveLocale,
    localized: resolved.localized,
    translationPending,
    translationFailed: wantsLocalized && translationFailed && !hasRequestedTranslation,
  });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
