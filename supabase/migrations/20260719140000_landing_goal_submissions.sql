-- Landing hero learning-goal capture for product research.
-- Inserts go through the service-role API only (no anon policies).

CREATE TABLE public.landing_goal_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_text text NOT NULL,
  expert_slug text,
  expert_name text,
  reply_source text NOT NULL DEFAULT 'fallback'
    CHECK (reply_source IN ('llm', 'cache', 'fallback')),
  ip_hash text,
  user_agent text,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  est_time text NOT NULL
);

CREATE INDEX landing_goal_submissions_created_at_idx
  ON public.landing_goal_submissions (created_at DESC);

CREATE INDEX landing_goal_submissions_expert_slug_idx
  ON public.landing_goal_submissions (expert_slug);

ALTER TABLE public.landing_goal_submissions ENABLE ROW LEVEL SECURITY;
