/** Time-phased honesty copy for missing post-call transcripts (design review DD2). */

export const TRANSCRIPT_HONESTY_PROCESSING_MS = 2 * 60 * 1000;
export const TRANSCRIPT_HONESTY_DELAYED_MS = 10 * 60 * 1000;
export const TRANSCRIPT_HONESTY_POLL_MS = 15 * 1000;

export type TranscriptHonestyPhase =
  | 'loading'
  | 'success'
  | 'error'
  | 'processing'
  | 'delayed'
  | 'unavailable'
  /** Row exists but no parseable speech lines (not a true wait). */
  | 'empty_stored';

export const TRANSCRIPT_HONESTY_COPY = {
  loading: 'Loading session transcript…',
  processing:
    'Preparing your transcript. This usually takes a minute after the call ends.',
  delayed:
    'Transcript is still processing. You can leave and return later — it will appear here when ready.',
  unavailable: 'Transcript is not available for this session.',
  emptyStored:
    'Transcript file was saved but no speech lines could be read. Contact support if this was a paid session.',
  loadError: 'Could not load transcript. Try again in a moment.',
} as const;

/**
 * Resolve which honesty state to show when transcript is missing or loading.
 * Timers start when the panel first sees a true missing transcript (404 only).
 * Stored-but-empty is never "processing".
 */
export function resolveTranscriptHonestyPhase(params: {
  loading: boolean;
  hasUtterances: boolean;
  /** Non-404 load failure */
  isLoadError: boolean;
  /** True wait: 404 — no session_transcripts row yet */
  isMissing: boolean;
  /** Row exists but utterances empty after resolve (status: empty) */
  isEmptyStored?: boolean;
  /** ms since first missing observation (or panel mount when missing) */
  missingElapsedMs: number;
}): TranscriptHonestyPhase {
  if (params.hasUtterances) {
    return 'success';
  }
  if (params.isEmptyStored) {
    return 'empty_stored';
  }
  if (params.loading && !params.isMissing && !params.isLoadError) {
    return 'loading';
  }
  if (params.isLoadError && !params.isMissing) {
    return 'error';
  }
  if (params.isMissing) {
    if (params.missingElapsedMs < TRANSCRIPT_HONESTY_PROCESSING_MS) {
      return 'processing';
    }
    if (params.missingElapsedMs < TRANSCRIPT_HONESTY_DELAYED_MS) {
      return 'delayed';
    }
    return 'unavailable';
  }
  if (!params.loading && !params.hasUtterances) {
    // Defensive: treated as true wait if flags not set (legacy)
    if (params.missingElapsedMs < TRANSCRIPT_HONESTY_PROCESSING_MS) {
      return 'processing';
    }
    if (params.missingElapsedMs < TRANSCRIPT_HONESTY_DELAYED_MS) {
      return 'delayed';
    }
    return 'unavailable';
  }
  return 'loading';
}

export function honestyCopyForPhase(phase: TranscriptHonestyPhase): string {
  switch (phase) {
    case 'loading':
      return TRANSCRIPT_HONESTY_COPY.loading;
    case 'processing':
      return TRANSCRIPT_HONESTY_COPY.processing;
    case 'delayed':
      return TRANSCRIPT_HONESTY_COPY.delayed;
    case 'unavailable':
      return TRANSCRIPT_HONESTY_COPY.unavailable;
    case 'empty_stored':
      return TRANSCRIPT_HONESTY_COPY.emptyStored;
    case 'error':
      return TRANSCRIPT_HONESTY_COPY.loadError;
    case 'success':
      return '';
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

export function shouldPollForTranscript(phase: TranscriptHonestyPhase): boolean {
  return phase === 'processing' || phase === 'delayed';
}
