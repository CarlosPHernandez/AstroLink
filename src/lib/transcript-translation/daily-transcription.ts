import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

/** Daily `transcription-message` event payload (subset). */
export type DailyTranscriptionMessagePayload = {
  text?: string;
  user_id?: string;
  timestamp?: number;
  is_final?: boolean;
  session_id?: string;
  speech_id?: string;
  start_ts?: number;
  end_ts?: number;
};

function segmentIdFromPayload(payload: DailyTranscriptionMessagePayload): string {
  const speechId = payload.speech_id?.trim();
  if (speechId) {
    return speechId;
  }
  const userId = payload.user_id ?? 'unknown';
  const start = payload.start_ts ?? payload.timestamp ?? 0;
  const text = payload.text?.trim() ?? '';
  return `${userId}:${start}:${text.slice(0, 64)}`;
}

/**
 * Parse a Daily transcription-message event into a TranscriptUtterance.
 * Returns null for empty or non-final messages when requireFinal is true.
 */
export function parseTranscriptionMessage(
  payload: DailyTranscriptionMessagePayload,
  options?: { requireFinal?: boolean },
): TranscriptUtterance | null {
  const requireFinal = options?.requireFinal ?? true;
  const text = payload.text?.trim() ?? '';
  if (!text) {
    return null;
  }

  const isFinal = payload.is_final !== false;
  if (requireFinal && !isFinal) {
    return null;
  }

  const speakerId = payload.user_id?.trim() || 'unknown';
  const startMs = Math.round((payload.start_ts ?? payload.timestamp ?? 0) * 1000);
  const endMs = Math.round((payload.end_ts ?? payload.timestamp ?? startMs / 1000) * 1000);

  return {
    id: segmentIdFromPayload(payload),
    speakerId,
    speakerRole: 'unknown',
    startMs: Number.isFinite(startMs) ? startMs : 0,
    endMs: Number.isFinite(endMs) ? endMs : startMs,
    text,
    isFinal,
  };
}

/** Dedupe key for coalescing partial/final segments. */
export function transcriptionDedupeKey(utterance: TranscriptUtterance): string {
  return `${utterance.speakerId}:${utterance.startMs}:${utterance.text}`;
}
