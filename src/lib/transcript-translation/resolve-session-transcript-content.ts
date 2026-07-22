/**
 * Pure resolution of stored transcript content for read paths.
 * Does not touch the database — re-parses VTT when utterances_json is empty.
 */

import type { Json } from '@/lib/database.types';
import { parseWebVtt } from '@/lib/transcript-translation/parse-webvtt';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

export type StoredTranscriptContent =
  | {
      status: 'ready';
      utterances: TranscriptUtterance[];
      /** True when utterances came from re-parsing vtt_text, not utterances_json */
      fromVttReparse: boolean;
    }
  | {
      status: 'empty';
      hasVtt: boolean;
    };

export function utterancesFromJson(value: Json | null | undefined): TranscriptUtterance[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as unknown as TranscriptUtterance[];
}

/**
 * Resolve utterances from a session_transcripts row shape.
 * Prefer non-empty utterances_json; otherwise re-parse vtt_text when present.
 */
export function resolveStoredTranscriptContent(params: {
  utterancesJson: Json | null | undefined;
  vttText: string | null | undefined;
}): StoredTranscriptContent {
  const fromJson = utterancesFromJson(params.utterancesJson);
  if (fromJson.length > 0) {
    return { status: 'ready', utterances: fromJson, fromVttReparse: false };
  }

  const vtt = params.vttText?.trim() ?? '';
  if (vtt) {
    const fromVtt = parseWebVtt(vtt);
    if (fromVtt.length > 0) {
      return { status: 'ready', utterances: fromVtt, fromVttReparse: true };
    }
    return { status: 'empty', hasVtt: true };
  }

  return { status: 'empty', hasVtt: false };
}
