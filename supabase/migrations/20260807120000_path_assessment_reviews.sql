-- PR-B: Written expert review of Space Path Assessment ($50 tripwire).
-- Separate from video_requests and pre_call_brief.

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS written_report_reviews_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.mentors.written_report_reviews_enabled IS
  'When true, mentor can receive paid written reviews of path assessments.';

-- Launch wedge: enable for listed demo experts when present
UPDATE public.mentors
SET written_report_reviews_enabled = true
WHERE slug IN ('chris-sembroski', 'eiman-jahangir')
  AND compliance_status = 'approved';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'path_assessment_review_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.path_assessment_review_status AS ENUM (
      'pending_payment',
      'paid',
      'in_progress',
      'delivered',
      'refunded',
      'expired'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.path_assessment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_assessment_id uuid NOT NULL REFERENCES public.path_assessments (id) ON DELETE RESTRICT,
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE RESTRICT,
  buyer_email text NOT NULL,
  buyer_name text NOT NULL DEFAULT '',
  public_token text NOT NULL UNIQUE,
  status public.path_assessment_review_status NOT NULL DEFAULT 'pending_payment',
  amount_cents integer NOT NULL DEFAULT 5000 CHECK (amount_cents > 0),
  stripe_payment_intent_id text NOT NULL,
  written_response text NULL,
  due_at timestamptz NULL,
  paid_at timestamptz NULL,
  delivered_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS path_assessment_reviews_stripe_pi_uidx
  ON public.path_assessment_reviews (stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS path_assessment_reviews_mentor_status_idx
  ON public.path_assessment_reviews (mentor_id, status, due_at);

CREATE INDEX IF NOT EXISTS path_assessment_reviews_assessment_idx
  ON public.path_assessment_reviews (path_assessment_id);

CREATE INDEX IF NOT EXISTS path_assessment_reviews_buyer_email_idx
  ON public.path_assessment_reviews (buyer_email);

ALTER TABLE public.path_assessment_reviews ENABLE ROW LEVEL SECURITY;

-- Agent id for audit (if enum exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'agent_id' AND n.nspname = 'public'
  ) THEN
    BEGIN
      ALTER TYPE public.agent_id ADD VALUE IF NOT EXISTS 'APX-11';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
