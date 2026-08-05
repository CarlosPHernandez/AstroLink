// =========================================================================
// AstraLink TypeScript Core Types & Database Schemas
// =========================================================================

// Enums matching Postgres DDL Types
export type ComplianceStatus =
  | 'pending_review'
  | 'document_required'
  | 'stripe_incomplete'
  | 'awaiting_human_approval'
  | 'approved'
  | 'rejected';

export type ServiceType = 'session_1on1' | 'pre_call_brief' | 'extended_session';

/** User-facing labels for booking UI (expert-network sessions, not recruiting). */
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  session_1on1: 'Expert session',
  pre_call_brief: 'Pre-call brief package',
  extended_session: 'Deep-dive expert session',
};

/** Label with booked length when known — do not hardcode 30/60 on variable sessions. */
export function formatServiceTypeLabel(
  serviceType: ServiceType | string,
  durationMinutes?: number | null,
): string {
  const base =
    serviceType in SERVICE_TYPE_LABELS
      ? SERVICE_TYPE_LABELS[serviceType as ServiceType]
      : String(serviceType);
  if (durationMinutes != null && Number.isFinite(durationMinutes) && durationMinutes > 0) {
    return `${base} (${Math.floor(durationMinutes)} min)`;
  }
  return base;
}

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'completed'
  | 'pending_review'
  | 'payment_failed'
  | 'cancelled'
  | 'refunded';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// 1. Users Table
export interface User {
  id: string; // UUID
  email: string;
  full_name: string;
  phone: string | null;
  bio: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Public expert session review (DTO — not a full DB row). */
export type {
  ExpertReviewAttributionType,
  ExpertReviewSource,
  ExpertReviewStatus,
  PublicExpertReview,
} from '@/lib/expert-reviews/types';

// 2. Mentors Table
export interface Mentor {
  id: string; // UUID
  email: string;
  full_name: string;
  slug: string | null;
  title: string | null;
  employer: string;
  is_civil_servant: boolean;
  expertise: string[];
  bio: string;
  image_url: string | null;
  intro_video_url: string | null;
  live_session_price_cents: number;
  /** Personal video offer (Cameo-style). */
  video_requests_enabled?: boolean;
  video_request_price_cents?: number;
  video_request_sla_days?: number;
  stripe_connect_account_id: string | null;
  stripe_onboarding_completed: boolean;
  compliance_status: ComplianceStatus;
  /** Shown on public directory when true and compliance_status is approved */
  is_listed: boolean;
  created_at: string;
}

// 3. Mentor Integrations Table
export interface MentorIntegration {
  id: string; // UUID
  mentor_id: string; // UUID
  provider: 'google_calendar';
  refresh_token: string; // Encrypted AES-256-GCM
  created_at: string;
}

// 4. Bookings Table
export interface Booking {
  id: string; // UUID
  mentee_id: string; // UUID
  mentor_id: string; // UUID
  service_type: ServiceType;
  include_pre_call_brief: boolean;
  status: BookingStatus;
  scheduled_at: string;
  stripe_payment_intent_id: string;
  duration_minutes?: number | null; // variable length from slider (prorated price)
  daily_room_url: string | null;
  mentor_token: string | null;
  mentee_token: string | null;
  match_reason: string | null;
  briefing_json: BriefingPayload | null;
  intake_background: string | null;
  created_at: string;
}

// 5. Sessions Table
export interface Session {
  id: string; // UUID
  booking_id: string; // UUID
  duration_seconds: number;
  transcript_available: boolean;
  summary_json: object | null;
  completed_at: string;
}

// 6. Transactions Table
export interface Transaction {
  id: string; // UUID
  booking_id: string; // UUID
  stripe_payment_intent_id: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  mentor_payout_cents: number;
  mentor_stripe_account: string;
  status: TransactionStatus;
  stripe_event_id: string;
  stripe_refund_id?: string | null;
  created_at: string;
}

// 7. Global Audit Log
export interface AuditLog {
  id: string; // UUID
  agent_id: 'APX-01' | 'APX-02' | 'APX-03' | 'APX-04' | 'APX-05' | 'APX-06' | 'APX-08' | 'APX-09';
  event: string;
  ref_id: string | null;
  payload: object | null;
  ts: string;
}

// 8. Compliance Reviews
export interface ComplianceReview {
  id: string; // UUID
  mentor_id: string; // UUID
  is_civil_servant: boolean;
  bio_risk_rating: 'low' | 'medium' | 'high';
  bio_analysis_reasoning: string | null;
  nf1860_extracted_data: object | null;
  reviewed_by_lead_at: string | null;
  created_at: string;
}

// AI Agent Schemas (Outputs)

export interface MatchingOutput {
  mentor_id: string;
  match_score: number; // Float between 0.0 and 1.0
  match_reason: string; // Actionable 1-sentence explanation
}

export interface BriefingAgenda {
  minutes_0_5: string;
  minutes_5_20: string;
  minutes_20_28: string;
  minutes_28_30: string;
}

/** APX-02 v2 mentee slice — second-person prep for the booking user. */
export interface MenteeBriefingOutput {
  personal_intro: string;
  session_objectives: string[];
  recommended_agenda: BriefingAgenda;
  your_context: string;
  questions_to_ask: string[];
  suggested_resources: string[];
}

/** APX-02 v2 expert slice — third-person prep for the mentor. */
export interface ExpertBriefingOutput {
  session_objectives: string[];
  recommended_agenda: BriefingAgenda;
  mentee_context_summary: string;
  facilitation_notes: string[];
  suggested_resources: string[];
}

/** APX-02 v2 dual-audience bundle for live sessions. */
export interface SessionBriefingBundle {
  version: 2;
  mentee: MenteeBriefingOutput;
  mentor: ExpertBriefingOutput;
}

/** APX-02 v1 legacy — expert-oriented single brief (pre-v2 bookings). */
export interface MentorBriefingOutput {
  session_objectives: string[];
  recommended_agenda: BriefingAgenda;
  mentee_context_summary: string;
  suggested_resources: string[];
}

/** APX-02 output for pre_call_brief — structures buyer context for an expert call, not resume/JD scoring. */
export interface PreCallBriefOutput {
  buyer_context_summary: string;
  buyer_strengths: string[]; // Max 2 — what the buyer brings to the conversation
  focus_areas: {
    topic: string;
    why_for_expert: string;
    severity: 'high' | 'medium';
    suggested_angle: string;
  }[]; // Exactly 3 topics to explore with the expert
  proposed_questions: string[]; // Max 5 questions to ask the expert
  session_readiness_score: number; // Float 0.0 - 1.0 — readiness to use expert time well
  one_line_summary: string;
}

export type BriefingPayload =
  | SessionBriefingBundle
  | MentorBriefingOutput
  | PreCallBriefOutput;

export interface PostSessionOutput {
  session_summary: string; // 3-4 sentence narrative
  key_insights: string[];  // 3-5 takeaways
  action_items: {
    task: string;
    owner: 'mentor' | 'mentee';
    deadline: string;
  }[];
  mentor_feedback_prompt: string;
  recommended_next_session: string;
}

export interface ComplianceReviewOutput {
  supervisor_signature_present: boolean;
  center_director_signature_present: boolean;
  expiration_date: string | null;
  is_expired: boolean;
  prohibits_nasa_contracts: boolean;
  document_appears_complete: boolean;
  anomalies: string[];
}
