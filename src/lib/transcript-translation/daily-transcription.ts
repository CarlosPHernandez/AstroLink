import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

type DeepgramAlternative = {
  transcript?: string;
  languages?: string[];
  confidence?: number;
};

/** Deepgram payload nested under Daily `rawResponse` when includeRawResponse is true. */
export type DeepgramRawResponse = {
  is_final?: boolean;
  channel?: {
    alternatives?: DeepgramAlternative[];
  };
};

/** Daily `transcription-message` event payload (daily-js shape + legacy fields). */
export type DailyTranscriptionMessagePayload = {
  text?: string;
  user_id?: string;
  participantId?: string;
  timestamp?: number | Date;
  is_final?: boolean;
  session_id?: string;
  speech_id?: string;
  start_ts?: number;
  end_ts?: number;
  rawResponse?: DeepgramRawResponse;
};

function timestampToStartMs(payload: DailyTranscriptionMessagePayload): number {
  if (payload.start_ts !== undefined) {
    return Math.round(payload.start_ts * 1000);
  }
  const ts = payload.timestamp;
  if (ts instanceof Date) {
    return ts.getTime();
  }
  if (typeof ts === 'number') {
    return ts < 1e12 ? Math.round(ts * 1000) : Math.round(ts);
  }
  return 0;
}

function timestampToEndMs(payload: DailyTranscriptionMessagePayload, startMs: number): number {
  if (payload.end_ts !== undefined) {
    return Math.round(payload.end_ts * 1000);
  }
  const startFromTs = timestampToStartMs(payload);
  return startFromTs > 0 ? startFromTs : startMs;
}

function textFromPayload(payload: DailyTranscriptionMessagePayload): string {
  const direct = payload.text?.trim();
  if (direct) {
    return direct;
  }
  return payload.rawResponse?.channel?.alternatives?.[0]?.transcript?.trim() ?? '';
}

function detectedLocaleFromPayload(payload: DailyTranscriptionMessagePayload): string | undefined {
  const langs = payload.rawResponse?.channel?.alternatives?.[0]?.languages;
  const first = langs?.[0]?.trim();
  return first || undefined;
}

function isFinalPayload(payload: DailyTranscriptionMessagePayload): boolean {
  if (payload.is_final === false) {
    return false;
  }
  if (payload.rawResponse?.is_final === false) {
    return false;
  }
  return true;
}

function segmentIdFromPayload(payload: DailyTranscriptionMessagePayload): string {
  const speechId = payload.speech_id?.trim();
  if (speechId) {
    return speechId;
  }
  const speakerKey =
    payload.participantId?.trim() || payload.user_id?.trim() || 'unknown';
  const start = payload.start_ts ?? (payload.timestamp instanceof Date ? payload.timestamp.getTime() / 1000 : payload.timestamp ?? 0);
  const text = textFromPayload(payload);
  return `${speakerKey}:${start}:${text.slice(0, 64)}`;
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
  const text = textFromPayload(payload);
  if (!text) {
    return null;
  }

  const isFinal = isFinalPayload(payload);
  if (requireFinal && !isFinal) {
    return null;
  }

  const speakerId =
    payload.user_id?.trim() || payload.participantId?.trim() || 'unknown';
  const startMs = timestampToStartMs(payload);
  const endMs = timestampToEndMs(payload, startMs);
  const detectedLocale = detectedLocaleFromPayload(payload);

  return {
    id: segmentIdFromPayload(payload),
    speakerId,
    speakerRole: 'unknown',
    startMs: Number.isFinite(startMs) ? startMs : 0,
    endMs: Number.isFinite(endMs) ? endMs : startMs,
    text,
    isFinal,
    detectedLocale,
  };
}

/** Dedupe key for coalescing partial/final segments. */
export function transcriptionDedupeKey(utterance: TranscriptUtterance): string {
  return `${utterance.speakerId}:${utterance.startMs}:${utterance.text}`;
}
