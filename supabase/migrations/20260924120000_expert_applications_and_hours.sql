ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS offered_services public.service_type[] NOT NULL
    DEFAULT ARRAY['session_1on1']::public.service_type[];

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS timezone text;

COMMENT ON COLUMN public.mentors.offered_services IS
  'Buyer-facing live services. Video requests stay on video_requests_enabled.';

CREATE TABLE public.expert_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  employer text NOT NULL,
  expertise text NOT NULL,
  bio text NOT NULL,
  hourly_rate_cents integer NOT NULL CHECK (hourly_rate_cents BETWEEN 100 AND 1000000),
  services public.service_type[] NOT NULL DEFAULT '{}',
  video_requests_enabled boolean NOT NULL DEFAULT false,
  video_request_price_cents integer NOT NULL DEFAULT 0 CHECK (video_request_price_cents >= 0),
  video_request_sla_days integer NOT NULL DEFAULT 7 CHECK (video_request_sla_days BETWEEN 3 AND 14),
  timezone text NOT NULL,
  windows jsonb NOT NULL,
  is_civil_servant boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'declined')),
  mentor_id uuid REFERENCES public.mentors (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expert_applications_status_created_idx
  ON public.expert_applications (status, created_at DESC);

CREATE TABLE public.mentor_availability_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minute smallint NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute smallint NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  CHECK (end_minute - start_minute >= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mentor_availability_windows_mentor_idx
  ON public.mentor_availability_windows (mentor_id);

ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability_windows ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies. Service role only.
