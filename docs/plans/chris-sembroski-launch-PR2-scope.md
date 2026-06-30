# PR2 scope allowlist — Chris campaign landing (desktop HUD)

**Do not edit files outside this list in PR2.** PR3 owns booking UI; PR4 owns launch ops.

**Design source:** `design/stitch/talk-with-chris/desktop-hud-session-indicator.html` (screen `c34090408bd44fe59f2694a3f255ce09`)

## Create

| Path | Purpose |
|------|---------|
| `src/lib/chris-campaign/chris-campaign-constants.ts` | Shared campaign constants (client-safe) |
| `src/lib/chris-campaign/chris-booking-href.ts` | Booking entry URLs with `campaign=chris` |
| `src/lib/chris-campaign/chris-booking-href.test.ts` | Href helper tests |
| `src/components/chris-campaign/chris-slot-indicator.tsx` | HUD slot bars + remaining copy |
| `src/components/chris-campaign/chris-question-queue.tsx` | Rotating question queue (client) |
| `src/components/chris-campaign/chris-request-session-form.tsx` | Email + Request Session CTA (client) |
| `src/components/chris-campaign/chris-expert-portrait.tsx` | Chris portrait + featured badge |
| `src/components/chris-campaign/chris-landing-footer.tsx` | Dark footer |
| `src/components/chris-campaign/chris-landing-client.tsx` | Desktop HUD layout shell (client) |
| `src/components/chris-campaign/chris-landing.css` | Stitch dark theme tokens + animations |
| `src/app/talk-with-chris/layout.tsx` | Dark viewport theme for landing |
| `src/app/talk-with-chris/loading.tsx` | Dark loading skeleton (not home skeleton) |
| `docs/plans/chris-sembroski-launch-PR2-scope.md` | This file |

## Modify

| Path | Purpose |
|------|---------|
| `src/app/talk-with-chris/page.tsx` | Server page: slots snapshot + session state |
| `src/lib/chris-campaign/chris-campaign-config.ts` | Re-export constants from client-safe module |

| `docs/plans/chris-sembroski-launch.md` | PR2 scope link |

## Explicitly out of scope (later PRs)

- Mobile-first Stitch screen (`mobile-refined-experience.html`) — PR2 ships desktop HUD; basic responsive fallback only
- `src/app/booking/booking-client.tsx` (PR3)
- Stripe promo, 45 min UI enforcement (PR3)
- E2E `e2e/talk-with-chris.spec.ts` (PR3)
- Referrer analytics wiring beyond preserving `?ref=` in URLs (PR4)
- `database.types.ts` regeneration