-- Add support for variable-duration live sessions (15min minimum, slider up to 2 hours).
-- live_session_price_cents on mentors is now treated as hourly rate for proration.
-- duration_minutes persisted for display, room sizing, and accurate charges.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;

COMMENT ON COLUMN public.bookings.duration_minutes IS 'Chosen call length in minutes (slider-driven; min 15, max 120 for 1:1 sessions). Used for prorated pricing and Daily room config.';

-- Backfill existing rows with previous hard-coded 30min assumption (safe default).
-- New bookings will set explicit value from the booking form slider.
UPDATE public.bookings
SET duration_minutes = 30
WHERE duration_minutes IS NULL OR duration_minutes = 0;