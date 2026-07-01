-- Chris campaign launch (PR4): attribute paid bookings to marketing referrers.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS marketing_referrer text;

CREATE INDEX IF NOT EXISTS bookings_marketing_referrer_idx
  ON public.bookings (marketing_referrer)
  WHERE marketing_referrer IS NOT NULL;
