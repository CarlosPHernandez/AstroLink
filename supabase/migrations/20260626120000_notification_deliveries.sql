-- APX-08: booking confirmation email delivery tracking

ALTER TYPE public.agent_id ADD VALUE IF NOT EXISTS 'APX-08';

CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email')),
  recipient_role text NOT NULL CHECK (recipient_role IN ('mentee', 'mentor')),
  resend_message_id text,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, channel, recipient_role)
);

CREATE INDEX notification_deliveries_booking_id_idx
  ON public.notification_deliveries (booking_id);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;