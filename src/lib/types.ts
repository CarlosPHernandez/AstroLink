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
  session_1on1: 'Expert session (30 min)',
  pre_call_brief: 'Pre-call brief package',
  extended_session: 'Deep-dive expert session (60 min)',
};

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'completed'
  | 'pending_review'
  | 'payment_failed';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// 1. Users Table
export interface User {
  id: string; // UUID
  email: string;
  full_name: string;
  created_at: string;
}

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
  daily_room_url: string | null;
  mentor_token: string | null;
  mentee_token: string | null;
  match_reason: string | null;
  briefing_json: MentorBriefingOutput | PreCallBriefOutput | null;
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
  created_at: string;
}

// 7. Global Audit Log
export interface AuditLog {
  id: string; // UUID
  agent_id: 'APX-01' | 'APX-02' | 'APX-03' | 'APX-04' | 'APX-05';
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

export interface MentorBriefingOutput {
  session_objectives: string[]; // Max 3 items
  recommended_agenda: {
    minutes_0_5: string;   // Framing
    minutes_5_20: string;  // Core deep-dive
    minutes_20_28: string; // Resources & development paths
    minutes_28_30: string; // Wrap up
  };
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
