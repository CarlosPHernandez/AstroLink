# Chris campaign launch checklist

Use this before enabling Chris Sembroski limited booking in **production** (`APP_MODE=waitlist` + `CHRIS_BOOKING_ENABLED=true`).

**Go-live product facts (code source of truth):**

| Fact | Value |
|------|--------|
| Early-access price | **$180** when `marketing_referrer` / `ref=early-signups` |
| Public / social price | **$200** for all other refs (including `chris-social`, `chris-sembroski`, missing ref) |
| Slot scarcity UI | Shown only for early-access (`early-signups`); hidden on social/public |
| Earliest bookable date | **2026-07-20** (America/New_York calendar day; also never before today Eastern) |
| Session length | 45 minutes fixed |
| Default slot cap | 15 (`CHRIS_SLOT_CAP`) |
| Pricing helpers | `src/lib/chris-campaign/chris-pricing.ts` + `chris-campaign-constants.ts` |

Do not configure a Stripe coupon or promotion code for this PaymentIntent path — dual pricing is resolved server-side from `marketing_referrer`.

## 1. Database

- [ ] Apply `20260627120000_booking_campaigns.sql` on hosted Supabase (if not already)
- [ ] Apply `20260701120000_booking_marketing_referrer.sql` for booking attribution
- [ ] Confirm `booking_campaigns` row exists for `chris-sembroski` with `slot_cap` **15** (or env override)

## 2. Vercel Production env

```bash
APP_MODE=waitlist
CHRIS_BOOKING_ENABLED=true
CHRIS_SLOT_CAP=15
CHRIS_MENTOR_SLUG=chris-sembroski
CHRIS_CAMPAIGN_ID=chris-sembroski
ENABLE_DEMO_AUTH=false
```

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
| Chris public / social (full $200) | `https://astro-link.space/talk-with-chris?ref=chris-social` (or `ref=chris-sembroski`) |
| Waitlist email early-access ($180) | `https://astro-link.space/talk-with-chris?ref=early-signups` |
| Waitlist generic signup | `https://astro-link.space/early-access?ref=early-signups` |
| Sold-out fallback (auto) | `/early-access?ref=early-signups` from Chris landing |

Referrer ids are documented in [marketing-referrer-taxonomy.md](./marketing-referrer-taxonomy.md).

## 4. Smoke tests (production or preview with prod-like env)

- [ ] `/talk-with-chris` loads (mobile short hero + video; desktop HUD)
- [ ] **Dual price UI**: `?ref=early-signups` shows **$180** + spots remaining; `?ref=chris-social` shows **$200** and **no** limited-slot chrome
- [ ] Date strip: no days before **July 20, 2026** (and none before today Eastern)
- [ ] `/experts` redirects to `/talk-with-chris`
- [ ] `/` redirects to `/early-access` when `APP_MODE=waitlist`
- [ ] CTA → `/booking?campaign=chris&…` wizard (Account step when signed out)
- [ ] `ref` survives landing → booking URL → PaymentIntent metadata (`marketing_referrer`)
- [ ] **Sign in** with existing Supabase user OR register with a real inbox (not `@test.com`)
- [ ] Supabase Auth → **Confirm email** is **Off** for launch (or confirm inbox before continuing wizard)
- [ ] Preview-only demo auth: seed mentees use real UUIDs (not `usr-…`) so `public.users` insert succeeds
- [ ] One test booking + refund in Stripe **sandbox** before live cutover (verify $180 early vs $200 social amounts)
- [ ] **Live webhook + Chris payment smoke (after live keys)**: Register webhook to direct `https://astro-link.space/api/webhooks/stripe`. Send test `payment_intent.succeeded` from Stripe Live dashboard → clean 200 (no 308). Complete one real charge per tier (or one live charge + refund). Verify: webhook `{"received":true}`, booking `confirmed`, transaction recorded, Chris "You're booked with Chris" ticket email (`notification_deliveries`), no stuck `pending_payment`. Capture logs.

## 4b. Waitlist email blast (ops, not app deploy)

- [ ] Paste HTML from `src/lib/email/chris-early-waitlist-sequence-templates.ts` into Resend Broadcasts (or ESP journey)
- [ ] All CTAs use `https://astro-link.space/talk-with-chris?ref=early-signups`
- [ ] Greeting is **Hey,** only (no first-name merge fields)
- [ ] Exit anyone who books so they only get transactional confirm/brief emails
- [ ] Full sequence runbook: [chris-early-waitlist-email-automation.md](./chris-early-waitlist-email-automation.md)

## 5. Admin ops

Sign in as admin → **Dashboard → Ops**:

- **Waitlist metrics** — early-access signups by referrer
- **Chris campaign** — slots remaining, bookings by status, bookings by `ref`

Use the weekly Slack template in [weekly-ops-slack-template.md](./weekly-ops-slack-template.md) for launch standups.

## 6. Rollback

Set `CHRIS_BOOKING_ENABLED=false` in Vercel Production and redeploy. Existing paid bookings are unaffected; `/talk-with-chris` shows waitlist CTA instead of booking.

## Production milestones (XPRIZE evidence)

### 2026-07-15 — First paid Chris campaign booking

- **Product:** Live booking on `www.astro-link.space` via `/talk-with-chris` early-access flow (`ref=early-signups`).
- **Commerce:** Payment completed through production Stripe PaymentIntent flow (early-access tier: **$180** server-resolved charge).
- **Attribution:** `marketing_referrer=early-signups` on booking record; admin Chris campaign metrics show referrer breakdown (Dashboard → Ops).
- **AI agent chain:** Post-payment pre-call brief generated via audited `LLM_DECISION` logs (export via admin audit API / T8 tooling).
- **Funnel observation:** At least one Supabase Auth account was created through the Chris wizard without a completed checkout (account step reached; no paid booking row).
- **Infrastructure:** Sampled Vercel production request logs (2026-07-15) showed HTTP 200/304 only — no 4xx/5xx in the window; drop-off prior to v0.6.9.0 instrumentation was a funnel measurement gap, not a visible server error.
- **Analytics (v0.6.9.0+):** Vercel custom events: `chris_landing_view`, `chris_request_session`, `chris_booking_page_view`, `chris_auth_success`, `chris_session_continue`, `chris_checkout_start`, `chris_checkout_success`, `chris_payment_error`, `chris_wizard_exit`. Implementation: `src/lib/chris-campaign/chris-campaign-analytics.ts`.

**Do not paste into public docs:** customer email, name, Stripe customer/charge IDs, PaymentIntent IDs, or booking UUIDs.

**Internal evidence pointers:** Supabase `bookings` + `transactions` for campaign `chris-sembroski`; Stripe Dashboard Live mode screenshots; `.gstack/qa-reports/` from 2026-07-14 canary.
