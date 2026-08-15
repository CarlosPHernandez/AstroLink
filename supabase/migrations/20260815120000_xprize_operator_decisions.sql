-- Demand match on Path Assessment + session settlement decisions.

ALTER TYPE public.agent_id ADD VALUE IF NOT EXISTS 'APX-12';

ALTER TABLE public.path_assessments
  ADD COLUMN IF NOT EXISTS recommended_mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS match_score numeric,
  ADD COLUMN IF NOT EXISTS match_reason text,
  ADD COLUMN IF NOT EXISTS matched_at timestamptz;

CREATE INDEX IF NOT EXISTS path_assessments_recommended_mentor_id_idx
  ON public.path_assessments (recommended_mentor_id);

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS ai_match_reason text,
  ADD COLUMN IF NOT EXISTS payout_eligible boolean;

CREATE TABLE IF NOT EXISTS public.session_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  decision text NOT NULL
    CHECK (decision IN ('completed', 'no_show_buyer', 'no_show_expert', 'too_short', 'dispute_hold')),
  confidence numeric,
  rationale text,
  payout_eligible boolean NOT NULL,
  refund_recommended boolean NOT NULL,
  provider text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT session_settlements_booking_id_unique UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS session_settlements_created_at_idx
  ON public.session_settlements (created_at DESC);

ALTER TABLE public.session_settlements ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_stripe_payment_intent_id_unique
  ON public.bookings (stripe_payment_intent_id);
