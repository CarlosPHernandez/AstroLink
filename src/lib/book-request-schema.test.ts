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

  it('rejects goals shorter than 10 characters', () => {
    expect(() =>
      BookBodySchema.parse({
        ...validBody,
        goals: 'too short',
      }),
    ).toThrow();
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
    const { mentorId: _mentorId, ...withoutMentor } = validBody;
    expect(BookBodySchema.parse(withoutMentor).mentorId).toBeUndefined();
  });
});
