# PR2.5 scope allowlist — Chris mobile landing + tablet HUD

**Do not edit files outside this list in PR2.5.** PR3 owns booking UI wiring; PR4 owns launch ops.

**Design source:** `design/stitch/talk-with-chris/mobileview-chris-booking-screen.html` (screen `97e793ca4c704151867b08adddaaba15`)

## Create

| Path | Purpose |
|------|---------|
| `src/lib/chris-campaign/chris-campaign-dates.ts` | July 2026+ booking month/date helpers |
| `src/lib/chris-campaign/chris-campaign-dates.test.ts` | Date helper unit tests |
| `src/components/chris-campaign/chris-mobile-landing.tsx` | Phone layout (`<768px`) |
| `src/components/chris-campaign/chris-mobile-booking-card.tsx` | Glass date picker + Book CTA |
| `design/stitch/talk-with-chris/mobileview-chris-booking-screen.{html,png}` | Stitch mobile reference |
| `design/stitch/talk-with-chris/manifest.json` | Stitch screen manifest (mobile primary) |
| `docs/plans/chris-sembroski-launch-PR2.5-scope.md` | This file |

## Modify

| Path | Purpose |
|------|---------|
| `src/components/chris-campaign/chris-landing-client.tsx` | Split phone vs tablet/desktop HUD at `md` |
| `src/components/chris-campaign/chris-landing.css` | Mobile tokens, glass card, spacing fixes |
| `src/components/chris-campaign/chris-expert-portrait.tsx` | `hero` variant for mobile |
| `src/components/chris-campaign/chris-slot-indicator.tsx` | `hero` + `pill` variants |
| `src/components/chris-campaign/chris-question-queue.tsx` | `scroll` variant for mobile queue |
| `src/components/chris-campaign/chris-request-session-form.tsx` | `mobile` variant |
| `src/app/talk-with-chris/loading.tsx` | Separate phone vs tablet/desktop skeletons |
| `docs/plans/chris-sembroski-launch.md` | PR2.5 scope link |

## Explicitly out of scope (later PRs)

- `src/app/booking/booking-client.tsx` date wiring (PR3)
- Stripe promo, 45 min UI enforcement (PR3)
- E2E `e2e/talk-with-chris.spec.ts` (PR3)
- Referrer analytics wiring beyond preserving `?ref=` in URLs (PR4)
- `database.types.ts` regeneration