import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { parseWebVtt } from '@/lib/transcript-translation/parse-webvtt';
import { mapSpeakersToRoles } from '@/lib/transcript-translation/map-speakers';

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const sampleVtt = readFileSync(join(fixtureDir, '__fixtures__/sample.vtt'), 'utf8');

describe('parseWebVtt', () => {
  it('parses cue timestamps and voice tags', () => {
    const utterances = parseWebVtt(sampleVtt);
    expect(utterances).toHaveLength(3);
    expect(utterances[0]).toMatchObject({
      speakerId: 'Chris Sembroski',
      text: 'We should review the RPO corridor before launch.',
      startMs: 1_000,
      endMs: 5_000,
    });
  });

  it('returns empty array for blank input', () => {
    expect(parseWebVtt('')).toEqual([]);
  });
});

describe('mapSpeakersToRoles', () => {
  it('maps display names to mentor and mentee roles', () => {
    const utterances = parseWebVtt(sampleVtt);
    const mapped = mapSpeakersToRoles(utterances, {
      mentorUserId: 'mentor-uuid',
      menteeUserId: 'mentee-uuid',
      mentorDisplayName: 'Chris Sembroski',
      menteeDisplayName: 'Carlos Hernandez',
    });

    expect(mapped[0]?.speakerRole).toBe('mentor');
    expect(mapped[1]?.speakerRole).toBe('mentee');
  });
});
