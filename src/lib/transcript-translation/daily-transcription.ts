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
  language?: string;
  languages?: string[];
  detected_language?: string;
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

function isUsableLocaleTag(tag: string): boolean {
  const normalized = tag.trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'multi' && normalized !== 'unknown';
}

function firstLocaleTag(...candidates: Array<string | string[] | undefined>): string | undefined {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const first = candidate.find((tag) => isUsableLocaleTag(tag))?.trim();
      if (first) {
        return first;
      }
      continue;
    }
    const trimmed = candidate?.trim();
    if (trimmed && isUsableLocaleTag(trimmed)) {
      return trimmed;
    }
  }
  return undefined;
}

function detectedLocaleFromPayload(payload: DailyTranscriptionMessagePayload): string | undefined {
  const alt = payload.rawResponse?.channel?.alternatives?.[0];
  return firstLocaleTag(
    payload.language,
    payload.detected_language,
    payload.languages,
    alt?.languages,
  );
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
  const speakerKey =
    payload.user_id?.trim() || payload.participantId?.trim() || 'unknown';
  const speechId = payload.speech_id?.trim();
  if (speechId) {
    return `${speakerKey}:${speechId}`;
  }
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
  return `${utterance.speakerId}:${utterance.id}:${utterance.startMs}:${utterance.text}`;
}
