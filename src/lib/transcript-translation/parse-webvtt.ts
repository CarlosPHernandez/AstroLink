import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

const TIMESTAMP_LINE =
  /^(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}\.\d{3})/;

const VOICE_TAG = /^<v\s+([^>]+)>(.*)$/i;

function parseTimestampToMs(timestamp: string): number {
  const [hours, minutes, rest] = timestamp.split(':');
  const [seconds, millis] = rest.split('.');
  return (
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1_000 +
    Number(millis)
  );
}

function parseCueText(rawLines: string[]): { speakerId: string; text: string } {
  const joined = rawLines.join(' ').trim();
  const voiceMatch = joined.match(VOICE_TAG);
  if (voiceMatch?.[1]) {
    return {
      speakerId: voiceMatch[1].trim(),
      text: (voiceMatch[2] ?? '').trim(),
    };
  }
  return { speakerId: 'unknown', text: joined };
}

/**
 * Parse Daily WebVTT into utterances. Speaker labels come from `<v Name>` cues when present.
 */
export function parseWebVtt(vttText: string): TranscriptUtterance[] {
  const normalized = vttText.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const blocks = normalized.split(/\n\n+/);
  const utterances: TranscriptUtterance[] = [];
  let index = 0;

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      continue;
    }

    if (lines[0] === 'WEBVTT' || lines[0].startsWith('NOTE')) {
      continue;
    }

    let lineOffset = 0;
    if (/^\d+$/.test(lines[0])) {
      lineOffset = 1;
    }

    const timingLine = lines[lineOffset];
    const timingMatch = timingLine?.match(TIMESTAMP_LINE);
    if (!timingMatch?.[1] || !timingMatch[2]) {
      continue;
    }

    const textLines = lines.slice(lineOffset + 1);
    if (textLines.length === 0) {
      continue;
    }

    const { speakerId, text } = parseCueText(textLines);
    if (!text) {
      continue;
    }

    index += 1;
    utterances.push({
      id: `utt-${index}`,
      speakerId,
      speakerRole: 'unknown',
      startMs: parseTimestampToMs(timingMatch[1]),
      endMs: parseTimestampToMs(timingMatch[2]),
      text,
      isFinal: true,
    });
  }

  return utterances;
}
