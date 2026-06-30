# Chris Sembroski Launch

**Branch:** `feat/chris-booking`  
**Public URL:** `https://<prod>/talk-with-chris?ref=chris-sembroski`  
**Design assets:** Google Stitch web + mobile → `design/stitch/talk-with-chris/`

## Goal

Ship 10 limited paid sessions with Chris Sembroski while keeping `APP_MODE=waitlist` on production. Opens the booking funnel only when `CHRIS_BOOKING_ENABLED=true`; hides the public experts directory; drives traffic from Chris promotion and waitlist email split.

## Naming (no public “wave” language)

| Layer | Use |
|-------|-----|
| Public ref (Chris) | `ref=chris-sembroski` |
| Waitlist email ref | `ref=early-signups` |
| Booking param | `campaign=chris` |
| Env | `CHRIS_BOOKING_ENABLED`, `CHRIS_SLOT_CAP`, `CHRIS_MENTOR_SLUG`, `CHRIS_CAMPAIGN_ID` |
| Code | `src/lib/chris-campaign/` |
| DB | `booking_campaigns`, `bookings.campaign_id` |

## Architecture

```
APP_MODE=waitlist + CHRIS_BOOKING_ENABLED=true
  → proxy allows /talk-with-chris, /auth, /booking, /session, mentee dashboard
  → /experts and /join/chris-sembroski redirect to /talk-with-chris
  → Supabase Auth on (demo auth off in prod)
  → POST /api/book with campaign=chris
       → resolveChrisCampaignForBooking()
       → booking_campaign_try_reserve (atomic)
       → bookings insert with campaign_id
  → pending_payment cancel → booking_campaign_release
```

**Slot accounting:** `pending_payment` rows count toward the cap. Manual cancel of unpaid bookings releases a slot. Paid confirmations keep the slot consumed.

**Auth:** Supabase email/password (no email confirm at launch). Magic link deferred.

**Duration:** 45 min fixed for Chris sessions — server enforcement in **PR3**.

## Environment (Vercel Production)

```bash
APP_MODE=waitlist
CHRIS_BOOKING_ENABLED=true
CHRIS_SLOT_CAP=10
CHRIS_MENTOR_SLUG=chris-sembroski
CHRIS_CAMPAIGN_ID=chris-sembroski
ENABLE_DEMO_AUTH=false
```

Apply migration `20260627120000_booking_campaigns.sql` to hosted Supabase before enabling the flag.

## PR stack

| PR | Scope |
|----|-------|
| **PR1** | Campaign infra: routing, slots, auth, booking API, placeholder landing |
| **PR2** | Full Stitch `/talk-with-chris` landing (desktop HUD) |
| **PR3** | Booking UI, 45 min fixed, Stripe promo code |
| **PR4** | Launch ops, referrer split, prod checklist |

**PR1 scope allowlist:** [`chris-sembroski-launch-PR1-scope.md`](./chris-sembroski-launch-PR1-scope.md) — do not edit files outside this list in PR1.

**PR2 scope allowlist:** [`chris-sembroski-launch-PR2-scope.md`](./chris-sembroski-launch-PR2-scope.md) — do not edit files outside this list in PR2.

## PR1 test checklist

- [ ] `npm test` — waitlist routes, app-mode, auth-redirect, chris-campaign-*, booking-agent, book-request-schema
- [ ] Migration applied on hosted Supabase
- [ ] Local smoke: `CHRIS_BOOKING_ENABLED=true` + `APP_MODE=waitlist` → `/talk-with-chris` loads, `/experts` redirects
- [ ] Code review against PR1 allowlist before merge

## Deferred (later PRs)

- Stripe promo / checklist (PR3–4)
- E2E `e2e/talk-with-chris.spec.ts` (PR3)
- `database.types.ts` regeneration after migration apply
- Public experts directory while Chris campaign is live