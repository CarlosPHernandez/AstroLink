# PR4 scope allowlist — Chris launch ops + referrer analytics

**Do not edit files outside this list in PR4.**

## Create

| Path | Purpose |
|------|---------|
| `supabase/migrations/20260701120000_booking_marketing_referrer.sql` | `bookings.marketing_referrer` column |
| `src/lib/chris-campaign/chris-campaign-referrer.ts` | Chris ref constants + parser |
| `src/lib/chris-campaign/chris-campaign-referrer.test.ts` | Referrer parser tests |
| `src/lib/chris-campaign/chris-waitlist-href.ts` | Waitlist link helper |
| `src/lib/chris-campaign/chris-waitlist-href.test.ts` | Waitlist href tests |
| `src/lib/chris-campaign/admin-chris-campaign-metrics.ts` | Admin ops snapshot |
| `docs/how-to/chris-campaign-launch-checklist.md` | Production launch runbook |
| `docs/plans/chris-sembroski-launch-PR4-scope.md` | This file |

## Modify

| Path | Purpose |
|------|---------|
| `src/lib/chris-campaign/chris-booking-href.ts` | Pass `ref` into booking URLs |
| `src/lib/chris-campaign/chris-booking-href.test.ts` | Ref param tests |
| `src/app/talk-with-chris/page.tsx` | Parse landing `?ref=` |
| `src/app/booking/page.tsx` | Parse booking `?ref=` |
| `src/components/chris-campaign/chris-landing-client.tsx` | Thread referrer to CTAs |
| `src/components/chris-campaign/chris-mobile-landing.tsx` | Thread referrer |
| `src/components/chris-campaign/chris-mobile-booking-card.tsx` | Ref in CTA + sold-out waitlist |
| `src/components/chris-campaign/chris-request-session-form.tsx` | Ref in CTA + sold-out waitlist |
| `src/components/chris-campaign/chris-booking-wizard.tsx` | POST marketingReferrer |
| `src/lib/book-request-schema.ts` | Optional marketingReferrer field |
| `src/lib/book-request-schema.test.ts` | Sanitization tests |
| `src/app/api/book/route.ts` | Pass referrer to booking agent |
| `src/services/agents/booking-agent.ts` | Persist referrer on booking + Stripe metadata |
| `src/app/api/admin/metrics/route.ts` | Chris campaign metrics in admin API |
| `src/app/dashboard/admin/admin-dashboard-client.tsx` | Chris campaign ops panel |
| `docs/how-to/marketing-referrer-taxonomy.md` | Chris + early-signups refs |
| `docs/plans/chris-sembroski-launch.md` | PR4 scope link + PR3.5 note |
| `e2e/talk-with-chris.spec.ts` | Ref preservation E2E |

## Explicitly out of scope

- Promo code UI on Pay step (env-only remains)
- `database.types.ts` regeneration (manual migration apply first)
- Stripe live cutover (see `stripe-production-cutover.md`)
