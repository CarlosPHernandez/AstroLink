# PR1 scope allowlist — Chris campaign infrastructure

**Do not edit files outside this list in PR1.** PR2+ own their surfaces.

## Create

| Path | Purpose |
|------|---------|
| `supabase/migrations/20260627120000_booking_campaigns.sql` | Campaign slots + `bookings.campaign_id` |
| `src/lib/chris-campaign/chris-campaign-config.ts` | Env flags + campaign constants |
| `src/lib/chris-campaign/chris-campaign-config.test.ts` | Config unit tests |
| `src/lib/chris-campaign/chris-campaign-slots.ts` | Reserve / release / slots remaining |
| `src/lib/chris-campaign/chris-campaign-slots.test.ts` | Slot helper tests |
| `src/lib/chris-campaign/chris-campaign-routes.ts` | Path allowlist for Chris booking surface |
| `src/lib/chris-campaign/validate-chris-booking.ts` | Server validation for `campaign=chris` |
| `src/lib/chris-campaign/validate-chris-booking.test.ts` | Validation tests |
| `src/lib/auth-redirect.test.ts` | Auth redirect when Chris booking on |
| `src/app/talk-with-chris/page.tsx` | Minimal placeholder (redirect target; full UI in PR2) |
| `docs/plans/chris-sembroski-launch.md` | Plan index |
| `docs/plans/chris-sembroski-launch-PR1-scope.md` | This file |

## Modify

| Path | Purpose |
|------|---------|
| `src/lib/waitlist/waitlist-routes.ts` | Chris routes + experts redirect |
| `src/lib/waitlist/waitlist-routes.test.ts` | Route tests |
| `src/lib/app-mode.ts` | `isChrisBookingEnabled` → Supabase auth |
| `src/lib/app-mode.test.ts` | App mode tests |
| `src/lib/session.ts` | Session in waitlist + Chris booking |
| `src/lib/auth-redirect.ts` | `/auth` when Chris booking on |
| `src/proxy.ts` | Redirect to `/talk-with-chris` |
| `src/services/agents/booking-agent.ts` | Slot reserve + `campaign_id` |
| `src/services/agents/booking-agent.test.ts` | Campaign booking tests |
| `src/lib/book-request-schema.ts` | Optional `campaign: 'chris'` |
| `src/app/api/book/route.ts` | Chris validation + 409 sold out |
| `src/app/api/bookings/[id]/cancel/route.ts` | Release slot on cancel |
| `.env.example` | Chris env vars |

## Explicitly out of scope (later PRs)

- `src/app/booking/booking-client.tsx` (PR3)
- `src/components/early-access/*` (PR2 copy only if needed)
- `src/components/landing/*`
- Stripe promo (PR3)
- E2E `e2e/talk-with-chris.spec.ts` (PR3)
- `design/stitch/*` (PR2)