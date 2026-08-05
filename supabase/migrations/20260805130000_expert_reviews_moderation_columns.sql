-- APX-09 non-blocking screening: persist diagnosis on expert_reviews.
-- Base table already exists in prod; this is ALTER-only.
-- Ensure agent enum exists (safe if already applied).

ALTER TYPE public.agent_id ADD VALUE IF NOT EXISTS 'APX-09';

ALTER TABLE public.expert_reviews
  ADD COLUMN IF NOT EXISTS moderation_verdict text NOT NULL DEFAULT 'error'
    CHECK (moderation_verdict IN ('clear', 'flagged', 'error')),
  ADD COLUMN IF NOT EXISTS moderation_reason text NULL,
  ADD COLUMN IF NOT EXISTS moderation_flags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS moderation_json jsonb NULL,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS auto_published boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.expert_reviews.moderation_verdict IS
  'APX-09 public-safety screen: clear | flagged | error (LLM failure). Does not block store.';
COMMENT ON COLUMN public.expert_reviews.moderation_json IS
  'Full structured LLM diagnosis. Admin-only; never return to mentee or public clients.';
COMMENT ON COLUMN public.expert_reviews.auto_published IS
  'True when APX-09 auto-approved (clear + consent). approved_by will be APX-09.';

CREATE INDEX IF NOT EXISTS expert_reviews_moderation_verdict_idx
  ON public.expert_reviews (moderation_verdict, status, created_at DESC);
