-- Personalized video requests (Cameo-style async modality).
-- Guest email identity; private delivery media; independent from live bookings.

-- Mentor offer flags
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS video_requests_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_request_price_cents integer NOT NULL DEFAULT 0
    CHECK (video_request_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS video_request_sla_days integer NOT NULL DEFAULT 7
    CHECK (video_request_sla_days BETWEEN 1 AND 30);

COMMENT ON COLUMN public.mentors.video_requests_enabled IS 'When true and price > 0, public profile offers personal video requests.';
COMMENT ON COLUMN public.mentors.video_request_price_cents IS 'Fixed price for a personal video request (USD cents).';
COMMENT ON COLUMN public.mentors.video_request_sla_days IS 'Fulfillment window in days after payment.';

-- Launch wedge: Chris + Eiman (slugs from production seed)
UPDATE public.mentors
SET
  video_requests_enabled = true,
  video_request_price_cents = CASE
    WHEN slug = 'chris-sembroski' THEN 14900
    WHEN slug = 'eiman-jahangir' THEN 14900
    ELSE video_request_price_cents
  END
WHERE slug IN ('chris-sembroski', 'eiman-jahangir');

CREATE TYPE public.video_request_status AS ENUM (
  'pending_payment',
  'paid_awaiting_expert',
  'delivered',
  'declined',
  'expired',
  'refunded'
);

CREATE TABLE public.video_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE RESTRICT,
  buyer_email text NOT NULL,
  buyer_user_id uuid NULL REFERENCES public.users (id) ON DELETE SET NULL,
  status public.video_request_status NOT NULL DEFAULT 'pending_payment',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  stripe_payment_intent_id text NOT NULL,
  stripe_customer_id text NULL,
  occasion text NOT NULL DEFAULT 'other',
  recipient_name text NULL,
  from_name text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  pronunciation_notes text NULL,
  due_at timestamptz NULL,
  paid_at timestamptz NULL,
  declined_at timestamptz NULL,
  decline_reason text NULL,
  delivered_at timestamptz NULL,
  video_storage_path text NULL,
  video_duration_seconds integer NULL CHECK (video_duration_seconds IS NULL OR video_duration_seconds >= 0),
  marketing_referrer text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX video_requests_stripe_pi_uidx
  ON public.video_requests (stripe_payment_intent_id);

CREATE INDEX video_requests_mentor_status_due_idx
  ON public.video_requests (mentor_id, status, due_at);

CREATE INDEX video_requests_buyer_email_idx
  ON public.video_requests (buyer_email);

CREATE INDEX video_requests_status_due_idx
  ON public.video_requests (status, due_at)
  WHERE status = 'paid_awaiting_expert';

ALTER TABLE public.video_requests ENABLE ROW LEVEL SECURITY;

-- Private delivery media (not public intro bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personalized-videos',
  'personalized-videos',
  false,
  209715200, -- 200MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
