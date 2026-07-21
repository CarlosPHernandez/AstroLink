-- Expert account activation: claim tokens + payout preference for pre-seeded mentors.

CREATE TYPE public.mentor_activation_status AS ENUM (
  'pending',
  'active'
);

CREATE TYPE public.mentor_payout_method AS ENUM (
  'paypal',
  'zelle',
  'cashapp',
  'bank_manual',
  'unset'
);

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS activation_status public.mentor_activation_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS pending_email text,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_method public.mentor_payout_method NOT NULL DEFAULT 'unset',
  ADD COLUMN IF NOT EXISTS payout_handle text;

CREATE UNIQUE INDEX IF NOT EXISTS mentors_pending_email_unique_idx
  ON public.mentors (lower(pending_email))
  WHERE pending_email IS NOT NULL;

COMMENT ON COLUMN public.mentors.activation_status IS
  'pending = invited/pre-seeded but wizard not finished; active = ready for dashboard.';
COMMENT ON COLUMN public.mentors.pending_email IS
  'Invite target email before claim; cleared when mentors.email is swapped on claim.';
COMMENT ON COLUMN public.mentors.payout_handle IS
  'Ops-sensitive payout destination handle (PayPal email, Zelle phone, etc.). Not public.';

CREATE TABLE public.mentor_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mentor_claim_tokens_mentor_id_idx
  ON public.mentor_claim_tokens (mentor_id);

CREATE INDEX mentor_claim_tokens_expires_at_idx
  ON public.mentor_claim_tokens (expires_at)
  WHERE used_at IS NULL;

ALTER TABLE public.mentor_claim_tokens ENABLE ROW LEVEL SECURITY;

-- Pre-seeded / unlinked experts need to claim before dashboard.
UPDATE public.mentors
SET activation_status = 'pending'
WHERE user_id IS NULL
  AND activated_at IS NULL
  AND activation_status = 'active';
