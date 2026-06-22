# Mentor dashboard ops — implementation guide

Agents and humans: read this before editing code on branch `mentor-dashboard-pr5`.

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

## Current PR: PR5 — Stripe Connect restore

**Goal:** Restore `/api/mentor/stripe-connect` behind `ENABLE_STRIPE_CONNECT_PAYOUTS`. Manual payouts remain the default; Connect onboarding and Express dashboard links work when the flag is enabled.

**Prerequisite:** PR4 merged to main via #50 (v0.4.10.0).

### Files (PR5 only)

```
src/app/api/mentor/stripe-connect/route.ts
src/app/api/mentor/stripe-connect/route.test.ts
.env.example
docs/plans/mentor-dashboard-ops/**
```

### Behavior

| `ENABLE_STRIPE_CONNECT_PAYOUTS` | Route behavior |
|---------------------------------|----------------|
| unset / `false` | 503 — manual payouts message (launch default) |
| `true` + `SKIP_STRIPE_PAYMENTS` | 200 `dev_skip` — no Stripe calls |
| `true` + live Stripe | `onboard` → account link; `dashboard` → Express login link |

UI (`mentor-payouts-panel`) already gates Connect CTAs via `isStripeConnectPayoutsEnabled()` — no dashboard changes in PR5.

### Acceptance criteria

- [ ] Route returns 503 when flag is off (unchanged launch default)
- [ ] Route restores onboard + dashboard flows when flag is on
- [ ] `dev_skip` path preserved when `SKIP_STRIPE_PAYMENTS=true`
- [ ] Unit tests cover deferred, enabled onboard/dashboard, and error paths
- [ ] `.env.example` documents the flag
- [ ] Scope check passes

### Verify

```bash
docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
npm test -- stripe-connect
```

## PR1–PR4 — done

| PR | Version | Summary |
|----|---------|---------|
| PR1 | v0.4.7.0 (#47) | Earnings truthfulness |
| PR2 | v0.4.8.0 (#48) | Manual payouts + Transfer column |
| PR3 | v0.4.9.0 (#49) | Public listing card |
| PR4 | v0.4.10.0 (#50) | UI flex sweep |