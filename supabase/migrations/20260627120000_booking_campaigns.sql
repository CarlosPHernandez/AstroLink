-- Limited booking campaigns (Chris Sembroski launch): atomic slot cap.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS campaign_id text;

CREATE INDEX IF NOT EXISTS bookings_campaign_id_idx
  ON public.bookings (campaign_id)
  WHERE campaign_id IS NOT NULL;

CREATE TABLE public.booking_campaigns (
  id text PRIMARY KEY,
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE RESTRICT,
  slot_cap integer NOT NULL CHECK (slot_cap > 0),
  slots_reserved integer NOT NULL DEFAULT 0 CHECK (slots_reserved >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_campaigns_slots_within_cap CHECK (slots_reserved <= slot_cap)
);

ALTER TABLE public.booking_campaigns ENABLE ROW LEVEL SECURITY;

-- No anon policies: service role only.

CREATE OR REPLACE FUNCTION public.booking_campaign_try_reserve(p_campaign_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.booking_campaigns
  SET slots_reserved = slots_reserved + 1
  WHERE id = p_campaign_id
    AND slots_reserved < slot_cap;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.booking_campaign_release(p_campaign_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.booking_campaigns
  SET slots_reserved = GREATEST(0, slots_reserved - 1)
  WHERE id = p_campaign_id;
END;
$$;

REVOKE ALL ON FUNCTION public.booking_campaign_try_reserve(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.booking_campaign_release(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.booking_campaign_try_reserve(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.booking_campaign_release(text) TO service_role;

-- Chris Sembroski limited launch (mentor seed id from 20260531140100_seed_d1_dev.sql)
INSERT INTO public.booking_campaigns (id, mentor_id, slot_cap, slots_reserved)
VALUES (
  'chris-sembroski',
  'a0000002-0000-4000-8000-000000000002',
  10,
  0
)
ON CONFLICT (id) DO NOTHING;