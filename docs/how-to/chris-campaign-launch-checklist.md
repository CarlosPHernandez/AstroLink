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

Chris campaign checkout charges the discounted launch amount ($180) directly on the PaymentIntent. Do not configure a Stripe coupon or promotion code for this PaymentIntent path.

Stripe keys must be **Live** mode in Production only. See [stripe-production-cutover.md](./stripe-production-cutover.md).

## 2b. Supabase Auth (hosted project)

Configure in [Supabase Dashboard → Authentication](https://supabase.com/dashboard/project/vwoizjesyyygmokfqpyy/auth/providers):

| Setting | Launch value | Why |
|---------|--------------|-----|
| **Confirm email** | **Off** for Chris launch | Inline wizard must advance without an inbox confirmation step ([launch plan](../plans/chris-sembroski-launch.md)) |
| **Site URL** | `https://astro-link.space` (non-www canonical) | OAuth and email redirect base. Add `https://www.astro-link.space/**` as an *additional* redirect URL only if you want to support both for user convenience. |
| **Redirect URLs** | `https://astro-link.space/**` (primary) | `/auth/confirm`, `/auth/callback`. Align with `NEXT_PUBLIC_APP_URL` and the direct webhook URL. |
| **Email rate limit** | Default; avoid rapid re-signups | Repeated register attempts hit `429 over_email_send_rate_limit` |

**Production signup troubleshooting**

- **"Use a different email" / generic error** — check Supabase **Auth → Logs**. Common causes:
  - Email already exists → use **Sign in** on the wizard instead of Create account.
  - `429` / `over_email_send_rate_limit` — wait ~1 hour or sign in if account was created.
  - `email_address_invalid` — Supabase blocks disposable domains (e.g. `@test.com`). Use Gmail/iCloud with a `+alias`.
- **Preview ops smoke** — set `ENABLE_DEMO_AUTH=true` on Vercel **Preview** only (not Production) to use seed presets without creating Auth users.

## 3. Marketing links

| Audience | URL |
|----------|-----|
| Chris public promotion | `https://astro-link.space/talk-with-chris?ref=chris-sembroski` (use the canonical non-www; www redirects are acceptable for users) |
| Waitlist email split | `https://astro-link.space/early-access?ref=early-signups` |
| Sold-out fallback (auto) | `/early-access?ref=early-signups` from Chris landing |

Referrer ids are documented in [marketing-referrer-taxonomy.md](./marketing-referrer-taxonomy.md).

## 4. Smoke tests (production or preview with prod-like env)

- [ ] `/talk-with-chris` loads with slot count
- [ ] `/experts` redirects to `/talk-with-chris`
- [ ] `/` redirects to `/early-access`
- [ ] CTA → `/booking?campaign=chris&…` wizard (Account step when signed out)
- [ ] `?ref=chris-sembroski` survives landing → booking URL
- [ ] **Sign in** with existing Supabase user OR register with a real inbox (not `@test.com`)
- [ ] Supabase Auth → **Confirm email** is **Off** for launch (or confirm inbox before continuing wizard)
- [ ] One test booking + refund in Stripe sandbox before live cutover
- [ ] **Live webhook + Chris payment smoke (after live keys)**: Register webhook to direct `https://astro-link.space/api/webhooks/stripe`. Send test `payment_intent.succeeded` from Stripe Live dashboard → receives clean 200 (no 308). Then complete a real $1 Chris test charge via the wizard. Verify: webhook delivery 200 + `{"received":true}`, booking becomes `confirmed`, transaction recorded, Chris "You're booked with Chris" email sent (check notification_deliveries), no stuck `pending_payment`. Capture logs. Restore launch price after.

## 5. Admin ops

Sign in as admin → **Dashboard → Ops**:

- **Waitlist metrics** — early-access signups by referrer
- **Chris campaign** — slots remaining, bookings by status, bookings by `ref`

Use the weekly Slack template in [weekly-ops-slack-template.md](./weekly-ops-slack-template.md) for launch standups.

## 6. Rollback

Set `CHRIS_BOOKING_ENABLED=false` in Vercel Production and redeploy. Existing paid bookings are unaffected; `/talk-with-chris` shows waitlist CTA instead of booking.
