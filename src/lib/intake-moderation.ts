/**
 * Future intake moderation hook — scan booking goals/background before confirm.
 * Planned checks (D2+): ITAR-sensitive export topics, hateful speech, hostile behavior.
 * Wire from POST /api/book before BookingAgent.bookSession.
 */

export type IntakeModerationInput = {
  goals: string;
  background: string;
};

export type IntakeModerationResult =
  | { allowed: true }
  | { allowed: false; reason: string; flags: IntakeModerationFlag[] };

export type IntakeModerationFlag =
  | 'itar_sensitive'
  | 'hateful_speech'
  | 'hostile_behavior'
  | 'other';

/** Stub: always allow until Gemini compliance-agent triage ships (see docs/d2-next-steps.md). */
export async function screenBookingIntake(
  _input: IntakeModerationInput,
): Promise<IntakeModerationResult> {
  return { allowed: true };
}
