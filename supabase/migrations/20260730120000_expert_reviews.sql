-- Public expert session reviews / testimonials (v1).
-- Writes are service-role / SQL only; public SELECT is limited to approved + consented rows.
-- Note: APX-09 agent_id is added in a separate migration (table may already exist in prod).

CREATE TABLE public.expert_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE CASCADE,
  booking_id uuid NULL REFERENCES public.bookings (id) ON DELETE SET NULL,
  reviewer_user_id uuid NULL REFERENCES public.users (id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quote text NOT NULL
    CHECK (char_length(trim(quote)) >= 20 AND char_length(quote) <= 600),
  display_name text NOT NULL
    CHECK (char_length(trim(display_name)) >= 2 AND char_length(display_name) <= 80),
  attribution_type text NOT NULL
    CHECK (attribution_type IN (
      'anonymous',
      'role_only',
      'first_name_only',
      'organization',
      'full_name'
    )),
  consent_to_publish boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'hidden', 'withdrawn')),
  source text NOT NULL DEFAULT 'manual_admin_entry'
    CHECK (source IN (
      'manual_admin_entry',
      'jotform',
      'post_session_survey',
      'email_permission'
    )),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz NULL,
  approved_by text NULL,
  consent_notes text NULL,
  locale text NULL DEFAULT 'en'
);

COMMENT ON TABLE public.expert_reviews IS
  'Permissioned public session feedback. Only status=approved AND consent_to_publish=true may be shown on public surfaces.';
COMMENT ON COLUMN public.expert_reviews.display_name IS
  'Public attribution string only (e.g. Verified Astro-Link user). Never raw users.full_name unless consented.';
COMMENT ON COLUMN public.expert_reviews.consent_notes IS
  'Internal ops notes (Jotform submission id, email proof). Never expose to clients.';
COMMENT ON COLUMN public.expert_reviews.source IS
  'How the review entered the system. First Chris review: jotform + manual SQL publish.';

CREATE INDEX expert_reviews_expert_status_idx
  ON public.expert_reviews (expert_id, status, created_at DESC);

CREATE UNIQUE INDEX expert_reviews_booking_id_uidx
  ON public.expert_reviews (booking_id)
  WHERE booking_id IS NOT NULL;

ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

-- Public read: approved + consented only. No client writes.
CREATE POLICY expert_reviews_public_select ON public.expert_reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    AND consent_to_publish = true
  );
