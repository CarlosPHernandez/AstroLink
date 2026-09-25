-- Packaged live-session offers (Expert Offers beta).
-- Writes go through Next.js + supabaseAdmin; public SELECT is published + listed mentors only.

ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'packaged_offer';

CREATE TYPE public.expert_offer_status AS ENUM (
  'draft',
  'published',
  'unpublished',
  'archived'
);

CREATE TABLE public.expert_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 8 AND 80),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text NOT NULL CHECK (char_length(description) BETWEEN 40 AND 1200),
  duration_minutes integer NOT NULL CHECK (duration_minutes IN (15, 30, 45, 60)),
  price_cents integer NOT NULL CHECK (price_cents >= 1000 AND price_cents <= 50000),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  status public.expert_offer_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  unpublished_at timestamptz,
  archived_at timestamptz,
  page_views integer NOT NULL DEFAULT 0,
  checkout_starts integer NOT NULL DEFAULT 0,
  bookings_paid integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, slug)
);

CREATE INDEX expert_offers_mentor_status_idx
  ON public.expert_offers (mentor_id, status);

CREATE INDEX expert_offers_published_idx
  ON public.expert_offers (status, published_at DESC)
  WHERE status = 'published';

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS expert_offers_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS expert_offer_id uuid
    REFERENCES public.expert_offers (id) ON DELETE RESTRICT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS offer_snapshot jsonb;

CREATE INDEX bookings_expert_offer_id_idx
  ON public.bookings (expert_offer_id)
  WHERE expert_offer_id IS NOT NULL;

UPDATE public.mentors
SET expert_offers_enabled = true
WHERE lower(email) = 'cpachecohernande631@access.alamancecc.edu';

ALTER TABLE public.expert_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY expert_offers_public_published_select ON public.expert_offers
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.id = mentor_id
        AND m.compliance_status = 'approved'
        AND m.is_listed = true
        AND m.expert_offers_enabled = true
    )
  );

COMMENT ON COLUMN public.mentors.expert_offers_enabled IS
  'When true, mentor can create packaged live-session offers and the Services tab is visible.';
