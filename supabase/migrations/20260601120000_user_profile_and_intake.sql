-- Mentee profile fields + booking intake background for mentor dashboard

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS intake_background text;
