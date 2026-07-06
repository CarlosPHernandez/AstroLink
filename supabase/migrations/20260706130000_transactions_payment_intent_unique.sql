-- Prevent duplicate ledger rows when Stripe webhook replay and client-side reconciliation
-- process the same PaymentIntent concurrently.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_stripe_payment_intent_id_key
  ON public.transactions (stripe_payment_intent_id);
