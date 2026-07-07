import { describe, expect, it } from 'vitest';
import { BookBodySchema } from '@/lib/book-request-schema';

describe('BookBodySchema', () => {
  const validBody = {
    mentorId: 'a0000002-0000-4000-8000-000000000002',
    serviceType: 'session_1on1' as const,
    includePreCallBrief: true,
    scheduledAt: '2026-06-15T18:00:00.000Z',
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

  it('accepts optional campaign=chris with 45-minute live session', () => {
    expect(
      BookBodySchema.parse({
        ...validBody,
        campaign: 'chris',
        durationMinutes: 45,
      }).campaign,
    ).toBe('chris');
  });

  it('rejects campaign=chris with non-45-minute duration', () => {
    const result = BookBodySchema.safeParse({
      ...validBody,
      campaign: 'chris',
      durationMinutes: 30,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.durationMinutes?.[0]).toContain('45');
    }
  });

  it('rejects campaign=chris with pre-call brief only', () => {
    const result = BookBodySchema.safeParse({
      ...validBody,
      campaign: 'chris',
      serviceType: 'pre_call_brief',
      durationMinutes: 45,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.serviceType?.[0]).toContain('live 1:1');
    }
  });

  it('sanitizes marketingReferrer on Chris bookings', () => {
    expect(
      BookBodySchema.parse({
        ...validBody,
        campaign: 'chris',
        marketingReferrer: 'chris-sembroski',
      }).marketingReferrer,
    ).toBe('chris-sembroski');
    expect(
      BookBodySchema.parse({
        ...validBody,
        campaign: 'chris',
        marketingReferrer: '<bad>',
      }).marketingReferrer,
    ).toBeUndefined();
  });
});
