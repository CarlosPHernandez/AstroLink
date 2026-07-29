export const VIDEO_REQUEST_OCCASIONS = [
  'career_advice',
  'school_project',
  'birthday_pep',
  'aerospace_intro',
  'other',
] as const;

export type VideoRequestOccasion = (typeof VIDEO_REQUEST_OCCASIONS)[number];

export const VIDEO_REQUEST_OCCASION_LABELS: Record<VideoRequestOccasion, string> = {
  career_advice: 'Career advice',
  school_project: 'School / project',
  birthday_pep: 'Birthday / pep talk',
  aerospace_intro: 'Aerospace intro',
  other: 'Other',
};

/** Example request text for the instructions field, per occasion. */
export function videoRequestInstructionsPlaceholder(
  occasion: VideoRequestOccasion,
  expertFirstName: string,
): string {
  const name = expertFirstName.trim() || 'there';
  const examples: Record<VideoRequestOccasion, string> = {
    career_advice: `Hey ${name} — I'm early in my career and trying to move from software into flight systems. What would you look for on a resume, and what should I stop wasting time on?`,
    school_project: `Hey ${name} — my team is building a canSat for a university competition. Could you record a short tip on how real programs scope a first hardware demo so we don't overbuild?`,
    birthday_pep: `Hey ${name} — happy birthday to my niece Maya. She just got into an aerospace program and would love a short pep talk from you about sticking with hard problems.`,
    aerospace_intro: `Hey ${name} — I'm new to the industry and keep getting lost in the jargon. In plain language, how do mission ops and engineering actually work together on a real program?`,
    other: `Hey ${name} — could you record a short message for my dad, who followed your career for years? Something warm about why space work is still worth it.`,
  };
  return examples[occasion];
}

export type VideoRequestStatus =
  | 'pending_payment'
  | 'paid_awaiting_expert'
  | 'delivered'
  | 'declined'
  | 'expired'
  | 'refunded';

export type VideoRequestRow = {
  id: string;
  mentor_id: string;
  buyer_email: string;
  buyer_user_id: string | null;
  status: VideoRequestStatus;
  price_cents: number;
  stripe_payment_intent_id: string;
  stripe_customer_id: string | null;
  occasion: string;
  recipient_name: string | null;
  from_name: string;
  instructions: string;
  pronunciation_notes: string | null;
  due_at: string | null;
  paid_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  delivered_at: string | null;
  video_storage_path: string | null;
  video_duration_seconds: number | null;
  marketing_referrer: string | null;
  created_at: string;
  updated_at: string;
};

export function isVideoRequestOccasion(value: string): value is VideoRequestOccasion {
  return (VIDEO_REQUEST_OCCASIONS as readonly string[]).includes(value);
}

export function normalizeBuyerEmail(email: string): string {
  return email.trim().toLowerCase();
}
