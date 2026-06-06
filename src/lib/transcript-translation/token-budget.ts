import type {
  TranscriptUtterance,
  TranscriptWindow,
  TranscriptWindowOptions,
} from '@/lib/transcript-translation/types';
import { DEFAULT_TRANSCRIPT_WINDOW_OPTIONS } from '@/lib/transcript-translation/types';

/** Rough token estimate (~4 chars per token for English technical speech). */
export function estimateTranscriptTokens(text: string): number {
  if (!text.trim()) return 0;
  return Math.ceil(text.length / 4);
}

const FILLER_PATTERN = /\b(um|uh|you know|like|sort of|kind of)\b/gi;

/** Strip fillers for APX-03 synthesis input only — not for canonical storage. */
export function stripFillerForSynthesis(text: string): string {
  return text.replace(FILLER_PATTERN, ' ').replace(/\s+/g, ' ').trim();
}

function utterancesInRange(
  utterances: TranscriptUtterance[],
  startMs: number,
  endMs: number,
): TranscriptUtterance[] {
  return utterances.filter((u) => u.startMs >= startMs && u.startMs < endMs);
}

function selectByExpertDensity(
  candidates: TranscriptUtterance[],
  maxTokens: number,
): TranscriptUtterance[] {
  const sorted = [...candidates].sort((a, b) => b.text.length - a.text.length);
  const selected: TranscriptUtterance[] = [];
  let tokens = 0;

  for (const u of sorted) {
    const next = estimateTranscriptTokens(u.text);
    if (tokens + next > maxTokens) continue;
    selected.push(u);
    tokens += next;
  }

  return selected.sort((a, b) => a.startMs - b.startMs);
}

/**
 * Select a token-bounded transcript window for APX-03 synthesis.
 * Always includes head + tail minutes; fills middle with expert-heavy segments.
 */
export function selectTranscriptWindow(
  utterances: TranscriptUtterance[],
  options: TranscriptWindowOptions = {},
): TranscriptWindow {
  const opts = { ...DEFAULT_TRANSCRIPT_WINDOW_OPTIONS, ...options };
  const totalUtteranceCount = utterances.length;

  if (totalUtteranceCount === 0) {
    return {
      text: '',
      utteranceCount: 0,
      totalUtteranceCount: 0,
      estimatedTokens: 0,
      truncated: false,
    };
  }

  const sessionEndMs = Math.max(...utterances.map((u) => u.endMs));
  const headEndMs = opts.headMinutes * 60 * 1000;
  const tailStartMs = Math.max(0, sessionEndMs - opts.tailMinutes * 60 * 1000);

  const head = utterancesInRange(utterances, 0, headEndMs);
  const tail = utterancesInRange(utterances, tailStartMs, sessionEndMs + 1);
  const headTailIds = new Set([...head, ...tail].map((u) => u.id));

  const middle = utterances.filter((u) => !headTailIds.has(u.id));
  const headTailText = [...head, ...tail]
    .sort((a, b) => a.startMs - b.startMs)
    .map((u) => u.text)
    .join('\n');
  const headTailTokens = estimateTranscriptTokens(headTailText);
  const remainingBudget = Math.max(0, opts.maxTokens - headTailTokens);

  const middleSelected = selectByExpertDensity(middle, remainingBudget);
  const selected = [...head, ...tail, ...middleSelected]
    .filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i)
    .sort((a, b) => a.startMs - b.startMs);

  const rawText = selected.map((u) => `[${u.speakerRole}] ${u.text}`).join('\n');
  const text = stripFillerForSynthesis(rawText);
  const estimatedTokens = estimateTranscriptTokens(text);

  return {
    text,
    utteranceCount: selected.length,
    totalUtteranceCount,
    estimatedTokens,
    truncated: selected.length < totalUtteranceCount,
  };
}

/** Max tokens per live/batch segment translation call. */
export const MAX_SEGMENT_TOKENS = 500;

export function isSegmentWithinBudget(text: string): boolean {
  return estimateTranscriptTokens(text) <= MAX_SEGMENT_TOKENS;
}
