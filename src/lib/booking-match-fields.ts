/**
 * Split buyer goals (briefing input) from Gemini match rationale (evidence).
 * `bookings.match_reason` historically stored goals; keep that contract.
 */

export type BookingMatchFields = {
  buyerGoals: string;
  aiMatchReason: string | null;
};

export function resolveBookingMatchFields(input: {
  menteeGoals: string;
  llmMatchReason?: string | null;
  didRunMatcher: boolean;
}): BookingMatchFields {
  const buyerGoals = input.menteeGoals.trim();
  if (!input.didRunMatcher) {
    return { buyerGoals, aiMatchReason: null };
  }
  const llm = input.llmMatchReason?.trim() ?? '';
  return {
    buyerGoals,
    aiMatchReason: llm.length > 0 ? llm : null,
  };
}
