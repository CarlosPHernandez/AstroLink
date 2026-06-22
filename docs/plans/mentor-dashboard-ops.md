# Mentor dashboard ops — eng-reviewed plan

**Branch:** `main` (stack merged)  
**Status:** Complete — PR1–PR5 shipped (#47–#51, v0.4.7.0 → v0.5.0.0)  
**Eng review:** CLEARED  
**Version shipped:** v0.5.0.0 (PR5, #51)

Implementation README: [mentor-dashboard-ops/README.md](./mentor-dashboard-ops/README.md)  
Guardrails: [mentor-dashboard-ops/GUARDRAILS.md](./mentor-dashboard-ops/GUARDRAILS.md)

## Expert journey (north star) — complete after PR5

1. **Payment recorded** — PR1 ✓
2. **Session complete** — booking status on ledger row
3. **Transfer** — PR2 ✓ (`mentor_payout_lines`)
4. **Public listing** — PR3 ✓
5. **Connect restore** — PR5: optional Stripe Express onboarding

## PR stack

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Merge layout fix branch | Done (#45) |
| PR1 | Earnings truthfulness + card labels | Done (#47, v0.4.7.0) |
| PR2 | Manual payouts + transfer UI | Done (#48, v0.4.8.0) |
| PR3 | Listing/compliance visibility | Done (#49, v0.4.9.0) |
| PR4 | UI flex sweep | Done (#50, v0.4.10.0) |
| PR5 | Stripe Connect restore | Done (#51, v0.5.0.0) |

## Decision ledger (PR5)

| # | Finding | Disposition |
|---|---------|-------------|
| 6 | Connect in same release as manual payouts | Deferred → PR5 behind flag |
| 11 | No Stripe payout webhook mirror yet | Deferred — manual lines remain source of truth |
| 17 | Route stubbed at launch (503) | Accepted → restore gated by env |

**Session outcome:** stack complete. Canvas summary: `mentor-dashboard-ops.canvas.tsx` (Cursor workspace `canvases/`). For follow-up work, invoke `/mentor-dashboard-ops-plan`.

## Test ledger

| Test | Command |
|------|---------|
| Unit | `npm test -- stripe-connect` |
| Scope | `docs/plans/mentor-dashboard-ops/scripts/check-scope.sh` |