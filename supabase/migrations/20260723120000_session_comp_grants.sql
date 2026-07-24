-- One-off redeemable session comps (not a multi-balance wallet).
-- One row = one grant; status + atomic update prevent double redemption.

CREATE TABLE public.session_comp_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  credit_minutes integer NOT NULL DEFAULT 15
    CHECK (credit_minutes = 15),
  eligible_scope text NOT NULL DEFAULT 'any_listed_expert'
    CHECK (eligible_scope IN ('any_listed_expert', 'mentor_ids')),
  eligible_mentor_ids uuid[] NULL,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'redeemed', 'revoked')),
  expires_at timestamptz NULL,
  internal_note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NULL,
  redeemed_at timestamptz NULL,
  redeemed_booking_id uuid NULL REFERENCES public.bookings (id) ON DELETE SET NULL,
  source_booking_id uuid NULL REFERENCES public.bookings (id) ON DELETE SET NULL,
  CONSTRAINT session_comp_grants_redeemed_booking_unique UNIQUE (redeemed_booking_id)
);

-- At most one available grant per user (MVP one-off safety).
CREATE UNIQUE INDEX session_comp_grants_one_available_per_user_idx
  ON public.session_comp_grants (user_id)
  WHERE status = 'available';

CREATE INDEX session_comp_grants_user_id_idx
  ON public.session_comp_grants (user_id);

ALTER TABLE public.session_comp_grants ENABLE ROW LEVEL SECURITY;

-- No browser policies: app reads/writes via service role only (matches booking writes).
COMMENT ON TABLE public.session_comp_grants IS
  'Single-use complimentary session grants (e.g. 15-min goodwill). Not a wallet.';
