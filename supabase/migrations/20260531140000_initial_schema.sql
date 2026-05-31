-- AstroLink initial schema (expert network / D1 foundation)
-- Matches src/lib/types.ts + D1 eng-review fields

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.compliance_status AS ENUM (
  'pending_review',
  'document_required',
  'stripe_incomplete',
  'awaiting_human_approval',
  'approved',
  'rejected'
);

CREATE TYPE public.service_type AS ENUM (
  'session_1on1',
  'pre_call_brief',
  'extended_session'
);

CREATE TYPE public.booking_status AS ENUM (
  'pending_payment',
  'confirmed',
  'completed',
  'pending_review',
  'payment_failed'
);

CREATE TYPE public.transaction_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE public.agent_id AS ENUM (
  'APX-01',
  'APX-02',
  'APX-03',
  'APX-04',
  'APX-05'
);

CREATE TYPE public.bio_risk_rating AS ENUM (
  'low',
  'medium',
  'high'
);

CREATE TYPE public.integration_provider AS ENUM (
  'google_calendar'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  slug text UNIQUE,
  title text,
  employer text NOT NULL DEFAULT '',
  expertise text[] NOT NULL DEFAULT '{}',
  bio text NOT NULL DEFAULT '',
  image_url text,
  intro_video_url text,
  live_session_price_cents integer NOT NULL DEFAULT 0
    CHECK (live_session_price_cents >= 0),
  is_civil_servant boolean NOT NULL DEFAULT false,
  stripe_connect_account_id text,
  stripe_onboarding_completed boolean NOT NULL DEFAULT false,
  compliance_status public.compliance_status NOT NULL DEFAULT 'pending_review',
  is_listed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mentors_compliance_status_idx ON public.mentors (compliance_status);
CREATE INDEX mentors_listed_idx ON public.mentors (is_listed)
  WHERE compliance_status = 'approved';

CREATE TABLE public.mentor_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE CASCADE,
  provider public.integration_provider NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, provider)
);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE RESTRICT,
  service_type public.service_type NOT NULL,
  include_pre_call_brief boolean NOT NULL DEFAULT false,
  status public.booking_status NOT NULL DEFAULT 'pending_payment',
  scheduled_at timestamptz NOT NULL,
  stripe_payment_intent_id text NOT NULL,
  daily_room_url text,
  mentor_token text,
  mentee_token text,
  match_reason text,
  briefing_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_mentee_id_idx ON public.bookings (mentee_id);
CREATE INDEX bookings_mentor_id_idx ON public.bookings (mentor_id);
CREATE INDEX bookings_status_idx ON public.bookings (status);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE CASCADE,
  duration_seconds integer NOT NULL DEFAULT 0
    CHECK (duration_seconds >= 0),
  transcript_available boolean NOT NULL DEFAULT false,
  summary_json jsonb,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE RESTRICT,
  stripe_payment_intent_id text NOT NULL,
  gross_amount_cents integer NOT NULL CHECK (gross_amount_cents >= 0),
  platform_fee_cents integer NOT NULL CHECK (platform_fee_cents >= 0),
  mentor_payout_cents integer NOT NULL CHECK (mentor_payout_cents >= 0),
  mentor_stripe_account text NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  stripe_event_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transactions_booking_id_idx ON public.transactions (booking_id);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id public.agent_id NOT NULL,
  event text NOT NULL,
  ref_id uuid,
  payload jsonb,
  ts timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_agent_id_ts_idx ON public.audit_log (agent_id, ts DESC);
CREATE INDEX audit_log_ref_id_idx ON public.audit_log (ref_id);

CREATE TABLE public.compliance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE CASCADE,
  is_civil_servant boolean NOT NULL,
  bio_risk_rating public.bio_risk_rating NOT NULL,
  bio_analysis_reasoning text,
  nf1860_extracted_data jsonb,
  reviewed_by_lead_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security (anon/authenticated; service role bypasses)
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reviews ENABLE ROW LEVEL SECURITY;

-- Public expert directory: approved + listed experts only
CREATE POLICY mentors_public_directory_select ON public.mentors
  FOR SELECT
  TO anon, authenticated
  USING (
    compliance_status = 'approved'
    AND is_listed = true
  );

-- No client writes on server-owned tables by default (API uses service role)
