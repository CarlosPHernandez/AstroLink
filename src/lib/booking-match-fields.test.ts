import { describe, expect, it } from 'vitest';
import { resolveBookingMatchFields } from './booking-match-fields';

describe('resolveBookingMatchFields', () => {
  it('keeps buyer goals and does not invent an AI match when the user picked the expert', () => {
    expect(
      resolveBookingMatchFields({
        menteeGoals: 'Learn propulsion',
        llmMatchReason: 'Would have picked Ada',
        didRunMatcher: false,
      }),
    ).toEqual({
      buyerGoals: 'Learn propulsion',
      aiMatchReason: null,
    });
  });

  it('persists the LLM match reason separately when matching ran', () => {
    expect(
      resolveBookingMatchFields({
        menteeGoals: 'Learn propulsion',
        llmMatchReason: 'Strong propulsion fit.',
        didRunMatcher: true,
      }),
    ).toEqual({
      buyerGoals: 'Learn propulsion',
      aiMatchReason: 'Strong propulsion fit.',
    });
  });

  it('does not treat empty LLM text as a match reason', () => {
    expect(
      resolveBookingMatchFields({
        menteeGoals: 'Learn propulsion',
        llmMatchReason: '   ',
        didRunMatcher: true,
      }),
    ).toEqual({
      buyerGoals: 'Learn propulsion',
      aiMatchReason: null,
    });
  });
});
