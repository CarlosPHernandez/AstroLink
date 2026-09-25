import { describe, expect, it } from 'vitest';
import {
  ExpertApplicationSchema,
  MentorOfferSchema,
  windowContains,
} from '@/lib/expert-offer/schema';

const validWindow = { weekday: 2, startMinute: 9 * 60, endMinute: 12 * 60 };

describe('ExpertApplicationSchema', () => {
  const base = {
    fullName: 'Avery Quinn',
    email: 'avery@example.com',
    employer: 'JSC',
    expertise: 'Guidance, navigation',
    bio: 'Ten years on crewed vehicle guidance.',
    hourlyRateDollars: 150,
    services: ['session_1on1'],
    videoRequest: { enabled: false },
    timezone: 'America/Chicago',
    windows: [validWindow],
    isCivilServant: false,
  };

  it('accepts a complete application', () => {
    expect(ExpertApplicationSchema.parse(base).email).toBe('avery@example.com');
  });

  it('rejects an hourly rate of 0', () => {
    const parsed = ExpertApplicationSchema.safeParse({ ...base, hourlyRateDollars: 0 });
    expect(parsed.success).toBe(false);
  });

  it('rejects an unknown service', () => {
    const parsed = ExpertApplicationSchema.safeParse({
      ...base,
      services: ['coaching'],
    });
    expect(parsed.success).toBe(false);
  });

  it('requires a video price when video is enabled', () => {
    const parsed = ExpertApplicationSchema.safeParse({
      ...base,
      services: [],
      videoRequest: { enabled: true },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an overnight window', () => {
    const parsed = ExpertApplicationSchema.safeParse({
      ...base,
      windows: [{ weekday: 1, startMinute: 22 * 60, endMinute: 2 * 60 }],
    });
    expect(parsed.success).toBe(false);
  });
});

describe('windowContains', () => {
  it('accepts a 25-minute session that starts and ends inside Tuesday 09:00–12:00 Chicago', () => {
    // 2026-09-29 is a Tuesday. 15:00Z = 10:00 America/Chicago (CDT, UTC-5).
    expect(
      windowContains([validWindow], 'America/Chicago', '2026-09-29T15:00:00.000Z', 25),
    ).toBe(true);
  });

  it('rejects a session that runs past the window end', () => {
    expect(
      windowContains([validWindow], 'America/Chicago', '2026-09-29T16:50:00.000Z', 25),
    ).toBe(false);
  });

  it('returns false when no windows are saved', () => {
    expect(windowContains([], 'America/Chicago', '2026-09-29T15:00:00.000Z', 25)).toBe(false);
  });
});

describe('MentorOfferSchema', () => {
  it('allows an offer with video only and no live service', () => {
    const parsed = MentorOfferSchema.safeParse({
      hourlyRateDollars: 200,
      services: [],
      videoRequest: { enabled: true, priceCents: 7500, slaDays: 7 },
      timezone: 'UTC',
      windows: [],
    });
    expect(parsed.success).toBe(true);
  });
});
