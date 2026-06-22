# Mentor dashboard ops — implementation guide

**Status:** Complete (PR1–PR5 merged, v0.4.7.0 → v0.5.0.0).

Agents and humans: use this guide for follow-up work on mentor earnings, payouts, listing, or Connect — not for re-implementing the shipped stack.

## Quick links

| Doc | Purpose |
|-----|---------|
| [../mentor-dashboard-ops.md](../mentor-dashboard-ops.md) | Full plan + decision ledger |
| [GUARDRAILS.md](./GUARDRAILS.md) | Allowed paths and forbidden changes |
| [../../how-to/mentor-dashboard-payouts-plan.md](../../how-to/mentor-dashboard-payouts-plan.md) | Original payouts how-to |
| Cursor canvas `mentor-dashboard-ops` | Before/after + CTO → CEO → mentor translations |

## Skills (invoke before follow-up work)

| Skill | When |
|-------|------|
| `/mentor-dashboard-ops` | Extending earnings, payouts, listing, or Connect on this initiative |
| `/mentor-dashboard-ops-plan` | Refining scope, eng review follow-ups, updating plan docs |

## Shipped stack (PR1–PR5)

| PR | Version | PR # | Summary |
|----|---------|------|---------|
| PR1 | v0.4.7.0 | #47 | Earnings truthfulness — Recorded / Awaiting / Transferred cards |
| PR2 | v0.4.8.0 | #48 | Manual payouts — `mentor_payout_lines`, admin mark-paid, Transfer column |
| PR3 | v0.4.9.0 | #49 | Public listing card — compliance, slug, preview |
| PR4 | v0.4.10.0 | #50 | UI flex sweep — stacked consultation + civil servant rows |
| PR5 | v0.5.0.0 | #51 | Stripe Connect restore behind `ENABLE_STRIPE_CONNECT_PAYOUTS` |

### Launch default

- `ENABLE_STRIPE_CONNECT_PAYOUTS=false` — manual payouts; Connect API returns 503.
- Ops marks bank transfers via **Admin → Mentor payouts**; mentors see Transfer status on Earnings.

### Enable Connect (preview/staging only)

Set `ENABLE_STRIPE_CONNECT_PAYOUTS=true` with sandbox Stripe keys. Route actions:

| Action | Behavior |
|--------|----------|
| `onboard` | Stripe Express account link |
| `dashboard` | Express login link |

UI (`mentor-payouts-panel`) gates Connect CTAs via `isStripeConnectPayoutsEnabled()`.

### Verify (regression)

```bash
docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
npm test -- mentor-earnings mentor-manual-payouts stripe-connect
npm run test:e2e -- e2e/mentor-dashboard.spec.ts e2e/admin-mentor-payouts.spec.ts
```