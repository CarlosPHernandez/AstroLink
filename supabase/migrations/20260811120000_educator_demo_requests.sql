-- B2B lead capture for the /for-educators page ("Book a demo").
-- Inserts go through the service-role API only (no anon policies).

CREATE TABLE public.educator_demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  school_name text NOT NULL,
  role text NOT NULL,
  student_population text,
  message text,
  referrer text,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX educator_demo_requests_created_at_idx
  ON public.educator_demo_requests (created_at DESC);

ALTER TABLE public.educator_demo_requests ENABLE ROW LEVEL SECURITY;
