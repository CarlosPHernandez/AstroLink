import { describe, expect, it } from 'vitest';
import { BookBodySchema } from '@/lib/book-request-schema';
import { CHRIS_GOALS_MIN_CHARS } from '@/lib/chris-campaign/chris-campaign-constants';

describe('BookBodySchema', () => {
  const validBody = {
    mentorId: 'a0000002-0000-4000-8000-000000000002',
    serviceType: 'session_1on1' as const,
    includePreCallBrief: true,
    scheduledAt: '2026-06-15T18:00:00.000Z',
    // ≥ CHRIS_GOALS_MIN_CHARS so chrisFuture reuses this goals string after hybrid floor.
    goals: 'Understand commercial crew certification path for our vehicle.',
    background: 'Series A space startup building reusable orbital tug with 12 engineers.',
    durationMinutes: 45, // from slider; prorated price used for the PI
  };

  it('accepts a valid D1 booking payload', () => {
    expect(BookBodySchema.parse(validBody)).toEqual(validBody);
  });

  it('rejects goals shorter than 10 characters with a human message', () => {
    const result = BookBodySchema.safeParse({
      ...validBody,
      goals: 'too short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.goals?.[0]).toBe(
        'Add at least 10 characters so your expert can prepare.',
      );
    }
  });

  it('rejects background shorter than 10 characters with a human message', () => {
    const result = BookBodySchema.safeParse({
      ...validBody,
      background: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.background?.[0]).toBe(
        'Add at least 10 characters about your background.',
      );
    }
  });

  it('rejects invalid mentor UUID', () => {
    expect(() =>
      BookBodySchema.parse({
        ...validBody,
        mentorId: 'not-a-uuid',
      }),
    ).toThrow();
  });

  it('allows omitting mentorId for APX-01 matching', () => {
    const withoutMentor = { ...validBody };
    delete withoutMentor.mentorId;
    expect(BookBodySchema.parse(withoutMentor).mentorId).toBeUndefined();
  });

  const chrisFuture = {
    ...validBody,
    campaign: 'chris' as const,
    scheduledAt: '2030-08-15T12:00:00.000Z',
    durationMinutes: 45,
  };

  it('accepts optional campaign=chris with 45-minute live session', () => {
    expect(BookBodySchema.parse(chrisFuture).campaign).toBe('chris');
  });

  it('accepts campaign=chris with 15–60 minute stepped durations', () => {
    for (const durationMinutes of [15, 30, 45, 60]) {
      expect(
        BookBodySchema.parse({ ...chrisFuture, durationMinutes }).durationMinutes,
      ).toBe(durationMinutes);
    }
  });

  it('rejects campaign=chris with non-stepped duration', () => {
    const result = BookBodySchema.safeParse({
      ...chrisFuture,
      durationMinutes: 20,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.durationMinutes?.[0]).toMatch(/15–60|steps/i);
    }
  });

  it('rejects campaign=chris with pre-call brief only', () => {
    const result = BookBodySchema.safeParse({
      ...chrisFuture,
      serviceType: 'pre_call_brief',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.serviceType?.[0]).toContain('live 1:1');
    }
  });

  it('rejects campaign=chris with a past session date', () => {
    const result = BookBodySchema.safeParse({
      ...chrisFuture,
      scheduledAt: '2026-07-01T12:00:00.000Z',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.scheduledAt?.[0]).toMatch(/on or after today/i);
    }
  });

  it('sanitizes marketingReferrer on Chris bookings', () => {
    expect(
      BookBodySchema.parse({
        ...chrisFuture,
        marketingReferrer: 'chris-sembroski',
      }).marketingReferrer,
    ).toBe('chris-sembroski');
    expect(
      BookBodySchema.parse({
        ...chrisFuture,
        marketingReferrer: '<bad>',
      }).marketingReferrer,
    ).toBeUndefined();
  });

  it('accepts campaign=chris with empty background and goals at floor', () => {
    const goals = 'G'.repeat(CHRIS_GOALS_MIN_CHARS);
    const parsed = BookBodySchema.parse({
      ...chrisFuture,
      goals,
      background: '',
    });
    expect(parsed.background).toBe('');
    expect(parsed.goals.length).toBe(CHRIS_GOALS_MIN_CHARS);
  });

  it('rejects campaign=chris when goals shorter than CHRIS_GOALS_MIN_CHARS', () => {
    const result = BookBodySchema.safeParse({
      ...chrisFuture,
      goals: 'G'.repeat(CHRIS_GOALS_MIN_CHARS - 1),
      background: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.goals?.[0]).toMatch(/prepare|characters|bit more/i);
    }
  });

  it('still requires non-Chris background min 10', () => {
    const result = BookBodySchema.safeParse({
      ...validBody,
      background: 'short',
    });
    expect(result.success).toBe(false);
  });
});
