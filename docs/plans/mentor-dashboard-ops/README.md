# Mentor dashboard ops — implementation guide

Agents and humans: read this before editing code on branch `mentor-dashboard-pr4`.

## Quick links

| Doc | Purpose |
|-----|---------|
| [../mentor-dashboard-ops.md](../mentor-dashboard-ops.md) | Full plan + decision ledger |
| [GUARDRAILS.md](./GUARDRAILS.md) | Allowed paths and forbidden changes |
| [../../how-to/mentor-dashboard-payouts-plan.md](../../how-to/mentor-dashboard-payouts-plan.md) | Original payouts how-to |

## Skills (invoke before work)

| Skill | When |
|-------|------|
| `/mentor-dashboard-ops` | Implementing PR1–PR5 on this initiative |
| `/mentor-dashboard-ops-plan` | Refining scope, eng review follow-ups, updating plan docs |

## Current PR: PR4 — UI flex sweep

**Goal:** Fix narrow-column text wrapping on session cards and the civil servant profile row using the stacked card pattern (`skills/mobile-first-design-practices` §2b).

**Prerequisite:** PR3 merged to main via #49 (v0.4.9.0).

### Files (PR4 only)

```
src/app/dashboard/mentor/mentor-consultation-card.tsx
src/app/dashboard/mentor/mentor-dashboard-client.tsx
docs/plans/mentor-dashboard-ops/**
```

### UI changes

**Sessions tab — consultation card**

- Stack title + status badge on row 1; session meta below.
- Goals and context full-width (no `md:grid-cols-2` beside each other).
- Join CTA in its own row below body copy (not `md:flex-row justify-between` with paragraph).
- Human-readable booking status labels + badge styles.

**Profile tab — civil servant row**

- Stack title + checkbox on row 1; NF-1860 explanation full-width on row 2.
- Remove `justify-between` layout that squeezes multi-sentence copy.

### Acceptance criteria

- [ ] Consultation card uses stacked layout (no side-by-side body + action squeezing copy)
- [ ] Civil servant row uses stacked layout with `data-testid="mentor-civil-servant-row"`
- [ ] Existing E2E selectors unchanged (`mentor-booking-*`, `mentor-join-*`, civil servant checkbox)
- [ ] Scope check passes

### Verify

```bash
docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
npm run test:e2e -- e2e/mentor-dashboard.spec.ts
```

## PR1 — done (#47, v0.4.7.0)

Earnings truthfulness + ops guardrails.

## PR2 — done (#48, v0.4.8.0)

Manual payouts + Transfer column + admin mark-paid.

## PR3 — done (#49, v0.4.9.0)

Public listing card on Profile tab.

## PR5 preview (do not start until PR4 merged)

- Stripe Connect restore behind `ENABLE_STRIPE_CONNECT_PAYOUTS`