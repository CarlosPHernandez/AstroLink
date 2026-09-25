-- Single-use, email-locked guest session invites (not a wallet, not the 15-min goodwill grant).
-- The URL token is never stored. token_hash is SHA-256 hex.

CREATE TABLE public.guest_session_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  email_lock text NOT NULL,
  mentor_id uuid NOT NULL REFERENCES public.mentors (id),
  duration_minutes integer NOT NULL DEFAULT 25
    CHECK (duration_minutes = 25),
  campaign_id text NOT NULL DEFAULT 'chris-sembroski',
  marketing_referrer text NOT NULL DEFAULT 'gtm-lockheed-comment-2026',
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'claimed', 'redeemed', 'revoked')),
  expires_at timestamptz NOT NULL,
  claimed_by_user_id uuid NULL REFERENCES public.users (id) ON DELETE SET NULL,
  claimed_at timestamptz NULL,
  redeemed_at timestamptz NULL,
  redeemed_booking_id uuid NULL REFERENCES public.bookings (id) ON DELETE SET NULL,
  internal_note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NULL,
  CONSTRAINT guest_session_invites_token_hash_unique UNIQUE (token_hash),
  CONSTRAINT guest_session_invites_redeemed_booking_unique UNIQUE (redeemed_booking_id),
  CONSTRAINT guest_session_invites_email_lock_normalized
    CHECK (email_lock = lower(email_lock) AND position('@' IN email_lock) > 1)
);

CREATE INDEX guest_session_invites_claimed_by_idx
  ON public.guest_session_invites (claimed_by_user_id)
  WHERE status = 'claimed';

ALTER TABLE public.guest_session_invites ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.guest_session_invites IS
  'Single-use email-locked complimentary session invites. Raw URL token is not stored.';
