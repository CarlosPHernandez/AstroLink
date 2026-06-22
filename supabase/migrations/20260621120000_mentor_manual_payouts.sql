-- Mentor manual payouts (ops bank transfers; line-item session transparency)
-- D1: mentor_manual_payouts batch header + mentor_payout_lines per transaction
-- D6: transaction_id UNIQUE enforces idempotent mark-paid

CREATE TABLE public.mentor_manual_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE RESTRICT,
  total_cents integer NOT NULL CHECK (total_cents > 0),
  reference_note text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_by_admin_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mentor_manual_payouts_mentor_id_idx
  ON public.mentor_manual_payouts (mentor_id);

CREATE INDEX mentor_manual_payouts_paid_at_idx
  ON public.mentor_manual_payouts (paid_at DESC);

CREATE TABLE public.mentor_payout_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.mentor_manual_payouts (id) ON DELETE RESTRICT,
  transaction_id uuid NOT NULL REFERENCES public.transactions (id) ON DELETE RESTRICT,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mentor_payout_lines_transaction_id_key UNIQUE (transaction_id)
);

CREATE INDEX mentor_payout_lines_payout_id_idx
  ON public.mentor_payout_lines (payout_id);

ALTER TABLE public.mentor_manual_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_payout_lines ENABLE ROW LEVEL SECURITY;

-- Admin preset for created_by_admin_id FK (matches auth-presets.ts)
INSERT INTO public.users (id, email, full_name)
VALUES (
  'a0000003-0000-4000-8000-000000000003',
  'admin@astrolink.ai',
  'Flight Command'
)
ON CONFLICT (email) DO NOTHING;