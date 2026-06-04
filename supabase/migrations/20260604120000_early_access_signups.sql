-- Early access waitlist for gauging interest before public launch

CREATE TABLE public.early_access_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'early-access',
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT early_access_signups_email_unique UNIQUE (email)
);

CREATE INDEX early_access_signups_created_at_idx
  ON public.early_access_signups (created_at DESC);

ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: inserts go through service role on the API route only.
