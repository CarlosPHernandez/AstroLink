-- Space Path Assessment (PR-A): free Gemini readiness report + live booking attach.
-- Service-role only (no anon/authenticated policies), same pattern as landing_goal_submissions.

ALTER TYPE public.agent_id ADD VALUE IF NOT EXISTS 'APX-10';

CREATE TABLE public.path_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token text NOT NULL,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  answers_json jsonb NOT NULL,
  report_json jsonb,
  report_html text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'failed')),
  llm_error text,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  email_sent_at timestamptz,
  email_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT path_assessments_public_token_unique UNIQUE (public_token)
);

CREATE INDEX path_assessments_email_idx
  ON public.path_assessments (email);

CREATE INDEX path_assessments_public_token_idx
  ON public.path_assessments (public_token);

CREATE INDEX path_assessments_created_at_idx
  ON public.path_assessments (created_at DESC);

ALTER TABLE public.path_assessments ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: API uses service role only.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS path_assessment_id uuid
    REFERENCES public.path_assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_path_assessment_id_idx
  ON public.bookings (path_assessment_id);
