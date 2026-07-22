import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

const TIMESTAMP_LINE =
  /^(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}\.\d{3})/;

/** Classic WebVTT: <v Speaker Name>spoken text */
const VOICE_TAG_INLINE = /^<v\s+([^>]+)>(.*)$/i;

/**
 * Daily stored transcripts: <v>Speaker Name:</v>spoken text
 * (closing tag; speaker often ends with a colon).
 */
const VOICE_TAG_DAILY = /^<v>([^<]+)<\/v>\s*(.*)$/i;

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

  const dailyMatch = joined.match(VOICE_TAG_DAILY);
  if (dailyMatch?.[1]) {
    const speakerId = dailyMatch[1].trim().replace(/:+\s*$/, '');
    return {
      speakerId: speakerId || 'unknown',
      text: (dailyMatch[2] ?? '').trim(),
    };
  }

  const inlineMatch = joined.match(VOICE_TAG_INLINE);
  if (inlineMatch?.[1]) {
    return {
      speakerId: inlineMatch[1].trim(),
      text: (inlineMatch[2] ?? '').trim(),
    };
  }

  return { speakerId: 'unknown', text: joined };
}

/**
 * True if the first line of a cue block is a cue identifier (not timing).
 * Numeric (`1`) or Daily (`transcript:0`).
 */
function isCueIdentifierLine(line: string): boolean {
  if (/^\d+$/.test(line)) {
    return true;
  }
  // Daily: transcript:0, transcript:12, etc.
  if (/^transcript:\d+$/i.test(line)) {
    return true;
  }
  return false;
}

/**
 * Parse Daily (or classic) WebVTT into utterances.
 * Speaker labels from `<v Name>text` or Daily `<v>Name:</v>text` when present.
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
    if (isCueIdentifierLine(lines[0])) {
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
