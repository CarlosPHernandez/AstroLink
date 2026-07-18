# Chris 45-minute slot reschedule (ops concierge)

When a mentee’s preferred day won’t work (e.g. Monday) but Chris opened other blocks, send a **warm reschedule email** with a signed link to pick an exact **45-minute** start.

## Prerequisites

- `RESEND_API_KEY` and `ENCRYPTION_KEY` in `.env.local` (and production)
- Optional: `RESEND_FROM`, `RESEND_REPLY_TO` (default reply-to: `support@astro-link.space`)
- `NEXT_PUBLIC_APP_URL` in production so picker links hit the live host
- Booking is a Chris campaign booking (`campaign_id = chris-sembroski`) in `confirmed` or `pending_payment`

## Send the email

```bash
npm run email:chris-slot-reschedule -- \
  --to mentee@example.com \
  --name Alex \
  --booking-id <uuid> \
  --tue 2026-07-21 \
  --thu 2026-07-23 \
  --fri 2026-07-24
```

Dry-run (no send; prints slot counts per day):

```bash
npm run email:chris-slot-reschedule -- \
  --to mentee@example.com \
  --booking-id <uuid> \
  --tue 2026-07-21 --thu 2026-07-23 --fri 2026-07-24 \
  --dry-run
```

Default open hours (America/Los_Angeles):

| Day | Hours | Typical 45-min count |
|-----|-------|----------------------|
| Tuesday | 12:00–4:00 PM | 5 starts (last 3:00 PM) |
| Thursday | 1:00–9:00 PM | 10 starts (last 7:45 PM) |
| Friday | 12:00–9:00 PM | 12 starts (last 8:15 PM) |

Only starts where **start + 45 minutes ≤ block end** are offered.

## What the mentee sees

1. Warm email: thanks, Chris is excited, something came up so Monday won’t work.
2. Day buttons + “Choose your 45-minute time” → `/r/chris-slot?t=…`
3. Pick day → pick start → **Confirm** → success message with exact time.

## What you get

On every successful choice, Resend sends an ops email to **`support@astro-link.space`** with booking id, previous `scheduled_at`, new start, and human label.

Also check server logs for:

```text
[chris-slot-choice] scheduled_at changed — re-check Daily room expiry if provisioned
```

If a Daily room was already provisioned, re-verify join window / room expiry for the new time.

## Soft copy (do not harden)

Email language should stay gentle: something came up on Chris’s side — not “you picked a bad day.”

## Related code

- Slots: `src/lib/chris-campaign/chris-availability-slots.ts`
- Token: `src/lib/chris-campaign/chris-slot-choice-token.ts`
- Email: `src/lib/email/chris-slot-reschedule-templates.ts`
- Page: `src/app/r/chris-slot/page.tsx`
- API: `src/app/api/chris-slot-choice/route.ts`
