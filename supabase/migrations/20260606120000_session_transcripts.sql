-- D3 Phase 1: canonical English transcript storage (Daily WebVTT + parsed utterances)

CREATE TABLE public.session_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE CASCADE,
  source_locale text NOT NULL DEFAULT 'en',
  vtt_text text,
  utterances_json jsonb,
  daily_transcript_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_transcripts_daily_transcript_id_idx
  ON public.session_transcripts (daily_transcript_id)
  WHERE daily_transcript_id IS NOT NULL;

ALTER TABLE public.session_transcripts ENABLE ROW LEVEL SECURITY;

-- Participant read access mirrors booking participant checks in recap API (4B)
CREATE POLICY session_transcripts_participant_select ON public.session_transcripts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = session_transcripts.booking_id
        AND (b.mentee_id = auth.uid() OR b.mentor_id = auth.uid())
    )
  );
