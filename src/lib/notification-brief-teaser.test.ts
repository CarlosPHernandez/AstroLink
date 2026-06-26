import { describe, expect, it } from 'vitest';

import { resolveMentorBriefTeaser } from '@/lib/notification-brief-teaser';

describe('resolveMentorBriefTeaser', () => {
  it('returns first session objective from v1 briefing', () => {
    expect(
      resolveMentorBriefTeaser({
        session_objectives: ['Clarify propulsion trade space', 'Review career path'],
        recommended_agenda: {
          minutes_0_5: 'a',
          minutes_5_20: 'b',
          minutes_20_28: 'c',
          minutes_28_30: 'd',
        },
        mentee_context_summary: 'summary',
        suggested_resources: [],
      }),
    ).toBe('Clarify propulsion trade space');
  });

  it('returns mentor objective from v2 bundle when present', () => {
    expect(
      resolveMentorBriefTeaser({
        version: 2,
        mentor: {
          session_objectives: ['Prep reactor thermal model questions'],
        },
      }),
    ).toBe('Prep reactor thermal model questions');
  });

  it('returns null for empty briefing', () => {
    expect(resolveMentorBriefTeaser(null)).toBeNull();
  });
});