import 'server-only';

import type { Json } from '@/lib/database.types';
import { supabaseAdmin } from '@/lib/supabase';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

export function countUtterancesFromJson(value: Json | null | undefined): number {
  if (!Array.isArray(value)) {
    return 0;
  }
  return value.length;
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

export async function persistSessionTranscript(params: {
  bookingId: string;
  vttText: string;
  utterances: TranscriptUtterance[];
  dailyTranscriptId?: string | null;
  sourceLocale?: string;
}): Promise<{ created: boolean; upgraded: boolean }> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('session_transcripts')
    .select('id, utterances_json')
    .eq('booking_id', params.bookingId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`session_transcripts lookup failed: ${existingError.message}`);
  }

  const newCount = params.utterances.length;

  if (existing) {
    const existingCount = countUtterancesFromJson(existing.utterances_json);
    if (existingCount > 0) {
      return { created: false, upgraded: false };
    }
    if (newCount > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('session_transcripts')
        .update({
          vtt_text: params.vttText,
          utterances_json: params.utterances as unknown as Json,
          daily_transcript_id: params.dailyTranscriptId ?? null,
          source_locale: params.sourceLocale ?? 'en',
        })
        .eq('booking_id', params.bookingId);

      if (updateError) {
        throw new Error(`session_transcripts update failed: ${updateError.message}`);
      }

      return { created: false, upgraded: true };
    }

    return { created: false, upgraded: false };
  }

  const { error: insertError } = await supabaseAdmin.from('session_transcripts').insert({
    booking_id: params.bookingId,
    source_locale: params.sourceLocale ?? 'en',
    vtt_text: params.vttText,
    utterances_json: params.utterances as unknown as Json,
    daily_transcript_id: params.dailyTranscriptId ?? null,
  });

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      return { created: false, upgraded: false };
    }
    throw new Error(`session_transcripts insert failed: ${insertError.message}`);
  }

  return { created: true, upgraded: false };
}
