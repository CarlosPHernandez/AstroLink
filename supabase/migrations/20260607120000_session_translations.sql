-- D3 Phase 2: localized post-session recap (APX-06) + mentee preferred_locale

ALTER TYPE public.agent_id ADD VALUE IF NOT EXISTS 'APX-06';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferred_locale text NOT NULL DEFAULT 'en';

CREATE TABLE public.session_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  target_locale text NOT NULL,
  summary_json jsonb,
  translated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, target_locale)
);

CREATE INDEX session_translations_booking_id_idx
  ON public.session_translations (booking_id);

ALTER TABLE public.session_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_translations_participant_select ON public.session_translations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = session_translations.booking_id
        AND (b.mentee_id = auth.uid() OR b.mentor_id = auth.uid())
    )
  );

-- Dev seed: Carlos mentee prefers Portuguese recap for E2E / demo
UPDATE public.users
SET preferred_locale = 'pt-BR'
WHERE email = 'carlos@astrolink.ai';
