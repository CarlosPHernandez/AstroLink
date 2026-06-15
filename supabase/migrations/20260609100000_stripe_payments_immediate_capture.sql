-- Stripe real payments launch (immediate capture + refunds)
-- - Extend booking_status enum with cancelled/refunded
-- - Add stripe_refund_id to transactions for API-initiated refunds
-- - Add UNIQUE constraint on transactions.stripe_event_id (idempotency; latent bug fix)

-- Append-only enum value additions (safe after initial creation)
ALTER TYPE public.booking_status ADD VALUE 'cancelled';
ALTER TYPE public.booking_status ADD VALUE 'refunded';

-- Refund correlation column (nullable; populated on refund success paths)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS stripe_refund_id text;

-- Enforce unique stripe_event_id for safe replay/duplicate webhook protection
-- (application code already treats 23505 as idempotent no-op)
ALTER TABLE public.transactions
  ADD CONSTRAINT IF NOT EXISTS transactions_stripe_event_id_key
  UNIQUE (stripe_event_id);