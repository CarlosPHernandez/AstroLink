# D1 implementation plan

Source: eng review on `carloshernandez-main-design-20260529-194416.md` (2026-05-30).  
Test plan: `~/.gstack/projects/astrolink/carloshernandez-main-eng-review-test-plan-20260530.md`

**Last updated:** 2026-06-01 — skip-Stripe E2E golden path automated via Playwright.

## Scope (locked)

Paid **live 1:1** golden path only. Defer text threads, recorded video, full tri-modal expert profiles, ITAR buyer triage.

## Implementation tasks

| Task | Status | Notes |
|------|--------|--------|
| **T1** — DB roster (seed mentors; landing from Supabase) | Done | `mentor-directory.ts`, seed migration, landing props |
| **T2** — Checkout (`/api/book` + Stripe Elements + server price) | Done | `booking-client.tsx`, `STRIPE_BOOKING_TEST_MODE` for dev without Connect (ignored in production via `isStripeBookingTestMode()`) |
| **T3** — Briefs (`briefing_json` + webhook APX-02) | Done | `post-payment.ts`, stripe webhook, mentee dashboard |
| **T4** — Daily (room + session page + capture) | Done (D1) | Private rooms, per-load meeting tokens, session gates. Webhook HMAC + `meeting.ended` → `post-session.ts`. See [reference/video-session.md](./reference/video-session.md). |
| **T5** — Tests (Vitest + contract tests + E2E golden path) | Done (skip-Stripe) | `npm test`, `npm run test:e2e` — Stripe/Daily webhook E2E deferred |

See [d2-next-steps.md](./d2-next-steps.md) for post-D1 priorities (brief auto-open, moderation, plain-language copy, three modalities).
| **T6** — SKUs (`session_1on1` + optional pre-call brief) | Done | `booking-pricing.ts`, booking UI |
| **T7** — Pricing (`live_session_price_cents` server-side) | Done | Migration + `BookingAgent` |
| **T8** — XPRIZE Gemini decision log export | Not started | |

### Checklist (mirror of design doc)

- [x] **T1** — DB roster — Seed mentors; landing reads Supabase
- [x] **T2** — Checkout — Wire `/api/book` + Stripe Elements + server price
- [x] **T3** — Briefs — `briefing_json` + webhook-triggered APX-02
- [x] **T4** — Daily — Real room + session page + webhook capture (no transcript API yet)
- [x] **T5** — Tests — Vitest harness + unit/contract tests (`npm test`); skip-Stripe E2E golden path (`npm run test:e2e`)
- [x] **T6** — SKUs — `session_1on1` + optional `pre_call_brief` add-on
- [x] **T7** — Pricing — `live_session_price_cents` on mentors
- [ ] **T8** — XPRIZE — Structured Gemini decision logs export

## Eng decisions shipped

| # | Decision | Shipped |
|---|----------|---------|
| 1 | Single roster source of truth (`mentors` table) | Yes |
| 2 | Wire `/api/book` to `BookingAgent` | Yes |
| 3 | Persist APX-02 on `bookings.briefing_json` | Yes |
| 4 | Real Daily room in D1 | Yes (private room + tokenized iframe) |
| 5 | Server-authoritative `live_session_price_cents` | Yes |
| 6 | D1 SKUs: live + optional brief add-on | Yes |
| 7 | APX-02 on payment success (idempotent webhook) | Yes |
| 8 | Vitest harness | Yes (`vitest.config.ts`, `npm test`) |
| 9 | Playwright E2E (skip-Stripe golden path) | Yes (`playwright.config.ts`, `npm run test:e2e`) |

## Video session demo (extended runbook)

Full rehearsal script, preflight, failure cheatsheet, and dev operator commands: [how-to/video-session-demo.md](./how-to/video-session-demo.md).

## Verify before demo (manual)

1. Sign in as Carlos (`carlos@astrolink.ai`).
2. Landing → book Chris → Stripe test card.
3. Webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` **or** `POST /api/book/fulfill` (dev only).
4. Mentee dashboard shows briefing; join `/session/[bookingId]`.
5. Stripe dashboard: authorized/captured charge with platform fee (test mode).
6. Daily: webhook `POST /api/webhooks/daily` subscribed to `meeting.ended`; set `DAILY_WEBHOOK_HMAC` from Daily dashboard.

## Repo map (D1)

| Area | Path |
|------|------|
| Roster | `src/lib/mentor-directory.ts` |
| Pricing | `src/lib/booking-pricing.ts` |
| Book API | `src/app/api/book/route.ts` |
| Dev fulfill | `src/app/api/book/fulfill/route.ts` |
| Stripe webhook | `src/app/api/webhooks/stripe/route.ts` |
| Post-pay orchestration | `src/lib/post-payment.ts` |
| Post-session orchestration | `src/lib/post-session.ts` |
| Daily | `src/lib/daily.ts`, `src/lib/booking-access.ts`, `src/app/session/[bookingId]/`, `src/app/api/webhooks/daily/`, `src/app/api/session/provision/` |
| Mentee dashboard | `src/lib/mentee-bookings.ts`, `mentee-dashboard-client.tsx` |
| Migrations | `supabase/migrations/20260531140000_*.sql`, `20260531140100_seed_d1_dev.sql` |
