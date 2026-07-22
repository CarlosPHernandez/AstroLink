import 'server-only';

import type { Json } from '@/lib/database.types';
import { mapSpeakersToRoles } from '@/lib/transcript-translation/map-speakers';
import { persistSessionTranscript } from '@/lib/transcript-translation/persist-transcript';
import {
  resolveStoredTranscriptContent,
} from '@/lib/transcript-translation/resolve-session-transcript-content';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';
import { supabaseAdmin } from '@/lib/supabase';

export type ResolvedSessionTranscript =
  | { status: 'not_found' }
  | {
      status: 'ready';
      utterances: TranscriptUtterance[];
      sourceLocale: string;
      backfilled: boolean;
    }
  | {
      status: 'empty';
      sourceLocale: string;
      hasVtt: boolean;
    };

async function loadParticipantNames(mentorId: string, menteeId: string): Promise<{
  mentorDisplayName: string | null;
  menteeDisplayName: string | null;
}> {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .in('id', [mentorId, menteeId]);

  if (error) {
    throw new Error(`Participant lookup failed: ${error.message}`);
  }

  const mentorUser = users?.find((user) => user.id === mentorId);
  const menteeUser = users?.find((user) => user.id === menteeId);

  let mentorDisplayName = mentorUser?.full_name ?? null;
  if (!mentorDisplayName) {
    const { data: mentorRow, error: mentorError } = await supabaseAdmin
      .from('mentors')
      .select('full_name')
      .eq('id', mentorId)
      .maybeSingle();
    if (mentorError) {
      throw new Error(`Mentor lookup failed: ${mentorError.message}`);
    }
    mentorDisplayName = mentorRow?.full_name ?? null;
  }

  return {
    mentorDisplayName,
    menteeDisplayName: menteeUser?.full_name ?? null,
  };
}

/**
 * Load session transcript for a booking: map speakers, re-parse empty utterances from VTT,
 * best-effort backfill when re-parse succeeds.
 */
export async function resolveSessionTranscriptForBooking(params: {
  bookingId: string;
  mentorId: string;
  menteeId: string;
}): Promise<ResolvedSessionTranscript> {
  const { data: row, error } = await supabaseAdmin
    .from('session_transcripts')
    .select('utterances_json, vtt_text, source_locale, daily_transcript_id')
    .eq('booking_id', params.bookingId)
    .maybeSingle();

  if (error) {
    throw new Error(`session_transcripts lookup failed: ${error.message}`);
  }
  if (!row) {
    return { status: 'not_found' };
  }

  const sourceLocale = row.source_locale ?? 'en';
  const content = resolveStoredTranscriptContent({
    utterancesJson: row.utterances_json as Json | null,
    vttText: row.vtt_text,
  });

  if (content.status === 'empty') {
    return {
      status: 'empty',
      sourceLocale,
      hasVtt: content.hasVtt,
    };
  }

  const names = await loadParticipantNames(params.mentorId, params.menteeId);
  const utterances = mapSpeakersToRoles(content.utterances, {
    mentorUserId: params.mentorId,
    menteeUserId: params.menteeId,
    mentorDisplayName: names.mentorDisplayName,
    menteeDisplayName: names.menteeDisplayName,
  });

  let backfilled = false;
  if (content.fromVttReparse) {
    try {
      const result = await persistSessionTranscript({
        bookingId: params.bookingId,
        vttText: row.vtt_text ?? '',
        utterances,
        dailyTranscriptId: row.daily_transcript_id,
        sourceLocale,
      });
      backfilled = result.upgraded;
    } catch (backfillError: unknown) {
      // Read path must still return utterances even if backfill fails.
      console.error('[resolve-session-transcript] backfill failed', {
        bookingId: params.bookingId,
        error: backfillError instanceof Error ? backfillError.message : String(backfillError),
      });
    }
  }

  return {
    status: 'ready',
    utterances,
    sourceLocale,
    backfilled,
  };
}
