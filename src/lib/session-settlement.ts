export const SETTLEMENT_DECISIONS = [
  'completed',
  'no_show_buyer',
  'no_show_expert',
  'too_short',
  'dispute_hold',
] as const;

export type SettlementDecision = (typeof SETTLEMENT_DECISIONS)[number];

export type SettlementPolicy = {
  payoutEligible: boolean;
  refundRecommended: boolean;
};

export function isSettlementDecision(value: unknown): value is SettlementDecision {
  return (
    typeof value === 'string' &&
    (SETTLEMENT_DECISIONS as readonly string[]).includes(value)
  );
}

/** Money rules are deterministic. Gemini chooses the decision; this applies it. */
export function applySettlementPolicy(decision: SettlementDecision): SettlementPolicy {
  switch (decision) {
    case 'completed':
      return { payoutEligible: true, refundRecommended: false };
    case 'no_show_buyer':
      return { payoutEligible: true, refundRecommended: false };
    case 'no_show_expert':
      return { payoutEligible: false, refundRecommended: true };
    case 'too_short':
      return { payoutEligible: false, refundRecommended: true };
    case 'dispute_hold':
      return { payoutEligible: false, refundRecommended: false };
  }
}

export type SettlementFacts = {
  bookedDurationMinutes: number;
  actualDurationMinutes: number | null;
  menteeJoined: boolean | null;
  mentorJoined: boolean | null;
  transcriptAvailable: boolean;
  utteranceCount: number;
  amountCents: number;
};

export function buildSettlementPrompt(facts: SettlementFacts): string {
  return [
    `Booked duration minutes: ${facts.bookedDurationMinutes}`,
    `Actual duration minutes: ${facts.actualDurationMinutes ?? 'unknown'}`,
    `Buyer joined: ${facts.menteeJoined ?? 'unknown'}`,
    `Expert joined: ${facts.mentorJoined ?? 'unknown'}`,
    `Stored transcript available: ${facts.transcriptAvailable}`,
    `Utterance count: ${facts.utteranceCount}`,
    `Amount cents: ${facts.amountCents}`,
    'Decide exactly one of: completed, no_show_buyer, no_show_expert, too_short, dispute_hold.',
    'Do not invent what was said. Use only these facts.',
  ].join('\n');
}
