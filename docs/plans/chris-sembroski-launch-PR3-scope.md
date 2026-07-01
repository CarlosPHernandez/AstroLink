# PR3 scope allowlist — Chris booking UI + 45 min + Stripe promo

**Do not edit files outside this list in PR3.** PR4 owns launch ops.

## Create

| Path | Purpose |
|------|---------|
| `src/lib/chris-campaign/chris-stripe-promo.ts` | Optional Stripe coupon/promo for Chris PaymentIntents |
| `src/lib/chris-campaign/chris-stripe-promo.test.ts` | Promo resolver unit tests |
| `src/lib/chris-campaign/chris-booking-mode.ts` | Client-safe Chris booking UI helpers (45 min, date prefill) |
| `src/lib/chris-campaign/chris-booking-mode.test.ts` | Booking mode helper tests |
| `e2e/talk-with-chris.spec.ts` | Landing → booking golden path with `campaign=chris` |
| `docs/plans/chris-sembroski-launch-PR3-scope.md` | This file |

## Modify

| Path | Purpose |
|------|---------|
| `src/lib/chris-campaign/chris-campaign-constants.ts` | `CHRIS_SESSION_DURATION_MINUTES` |
| `src/lib/chris-campaign/chris-booking-href.ts` | Pass optional `date` query to `/booking` |
| `src/lib/chris-campaign/chris-booking-href.test.ts` | Date param tests |
| `src/components/chris-campaign/chris-mobile-booking-card.tsx` | CTA passes selected date |
| `src/components/chris-campaign/chris-request-session-form.tsx` | Desktop CTA uses campaign booking path |
| `src/app/booking/page.tsx` | Read `campaign` + `date` search params |
| `src/app/booking/booking-client.tsx` | Chris mode: locked mentor, 45 min, no slider |
| `src/lib/book-request-schema.ts` | Enforce 45 min + live 1:1 when `campaign=chris` |
| `src/lib/book-request-schema.test.ts` | Chris campaign schema tests |
| `src/app/api/book/route.ts` | Default/enforce Chris duration server-side |
| `src/services/agents/booking-agent.ts` | Force 45 min + apply Stripe promo for campaign |
| `src/services/agents/booking-agent.test.ts` | Campaign duration + promo tests |
| `.env.example` | `CHRIS_STRIPE_COUPON_ID` / `CHRIS_STRIPE_PROMOTION_CODE` |
| `playwright.config.ts` | `CHRIS_BOOKING_ENABLED=true` for E2E |
| `e2e/helpers/supabase-cleanup.ts` | Release campaign slots on E2E cleanup |
| `docs/plans/chris-sembroski-launch.md` | PR3 scope link |

## Explicitly out of scope (PR4)

- Referrer analytics wiring beyond preserving `?ref=` in URLs
- Production launch checklist / ops runbook
- `database.types.ts` regeneration