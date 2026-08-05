/** Public DTO only — never include reviewer_user_id, booking_id, consent_notes. */
export type PublicExpertReview = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
  displayName: string;
  /** True when the published row was linked to a booking at query time. */
  verifiedSession: boolean;
};

export type ExpertReviewStatus = 'pending' | 'approved' | 'hidden' | 'withdrawn';

export type ExpertReviewAttributionType =
  | 'anonymous'
  | 'role_only'
  | 'first_name_only'
  | 'organization'
  | 'full_name';

export type ExpertReviewSource =
  | 'manual_admin_entry'
  | 'jotform'
  | 'post_session_survey'
  | 'email_permission';

/** Row shape used by map/filter helpers (subset of DB columns). */
export type ExpertReviewRow = {
  id: string;
  rating: number;
  quote: string;
  display_name: string;
  consent_to_publish: boolean;
  status: string;
  booking_id: string | null;
};
