# Chris campaign launch checklist

Use this before enabling Chris Sembroski limited booking in **production** (`APP_MODE=waitlist` + `CHRIS_BOOKING_ENABLED=true`).

## 1. Database

- [ ] Apply `20260627120000_booking_campaigns.sql` on hosted Supabase (if not already)
- [ ] Apply `20260701120000_booking_marketing_referrer.sql` for booking attribution
- [ ] Confirm `booking_campaigns` row exists for `chris-sembroski` with correct `slot_cap`

## 2. Vercel Production env

```bash
APP_MODE=waitlist
CHRIS_BOOKING_ENABLED=true
CHRIS_SLOT_CAP=10
CHRIS_MENTOR_SLUG=chris-sembroski
CHRIS_CAMPAIGN_ID=chris-sembroski
ENABLE_DEMO_AUTH=false
```

Optional promo (sandbox first, then live):

```bash
CHRIS_STRIPE_COUPON_ID=coupon_...
# or
CHRIS_STRIPE_PROMOTION_CODE=CHRIS2026
```

Stripe keys must be **Live** mode in Production only. See [stripe-production-cutover.md](./stripe-production-cutover.md).

## 3. Marketing links

| Audience | URL |
|----------|-----|
| Chris public promotion | `https://www.astro-link.space/talk-with-chris?ref=chris-sembroski` |
| Waitlist email split | `https://www.astro-link.space/early-access?ref=early-signups` |
| Sold-out fallback (auto) | `/early-access?ref=early-signups` from Chris landing |

Referrer ids are documented in [marketing-referrer-taxonomy.md](./marketing-referrer-taxonomy.md).

## 4. Smoke tests (production or preview with prod-like env)

- [ ] `/talk-with-chris` loads with slot count
- [ ] `/experts` redirects to `/talk-with-chris`
- [ ] `/` redirects to `/early-access`
- [ ] CTA → `/booking?campaign=chris&…` wizard (Account step when signed out)
- [ ] `?ref=chris-sembroski` survives landing → booking URL
- [ ] One test booking + refund in Stripe sandbox before live cutover

## 5. Admin ops

Sign in as admin → **Dashboard → Ops**:

- **Waitlist metrics** — early-access signups by referrer
- **Chris campaign** — slots remaining, bookings by status, bookings by `ref`

Use the weekly Slack template in [weekly-ops-slack-template.md](./weekly-ops-slack-template.md) for launch standups.

## 6. Rollback

Set `CHRIS_BOOKING_ENABLED=false` in Vercel Production and redeploy. Existing paid bookings are unaffected; `/talk-with-chris` shows waitlist CTA instead of booking.
