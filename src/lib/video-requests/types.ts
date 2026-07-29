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
