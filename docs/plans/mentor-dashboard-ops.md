# Mentor dashboard ops — eng-reviewed plan

**Branch:** `mentor-dashboard-pr4`  
**Status:** In progress (PR4 active)  
**Eng review:** CLEARED  
**Version target:** v0.4.10.0 (PR4), v0.5.0.0 (PR5 Connect optional)

Implementation README: [mentor-dashboard-ops/README.md](./mentor-dashboard-ops/README.md)  
Guardrails: [mentor-dashboard-ops/GUARDRAILS.md](./mentor-dashboard-ops/GUARDRAILS.md)

## Expert journey (north star)

Mentors see per booking:

1. **Payment recorded** — PR1 ✓
2. **Session complete** — booking status on ledger row
3. **Transfer** — PR2 ✓ (`mentor_payout_lines`)
4. **Public listing** — PR3 ✓

## PR stack

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Merge layout fix branch | Done (#45) |
| PR1 | Earnings truthfulness + card labels | Done (#47, v0.4.7.0) |
| PR2 | Manual payouts + transfer UI | Done (#48, v0.4.8.0) |
| PR3 | Listing/compliance visibility | Done (#49, v0.4.9.0) |
| PR4 | UI flex sweep | **In progress** |
| PR5 | Stripe Connect restore (deferred) | Pending |

## Decision ledger (PR4)

| # | Finding | Disposition |
|---|---------|-------------|
| 15 | Consultation card squeezes goals/context on md+ | Accepted → stacked card §2b |
| 16 | Civil servant row squeezes NF-1860 copy | Accepted → stacked row |

**Session outcome:** invoke `/mentor-dashboard-ops` on `mentor-dashboard-pr4`

## Test ledger

| Test | Command |
|------|---------|
| E2E | `npm run test:e2e -- e2e/mentor-dashboard.spec.ts` |
| Scope | `docs/plans/mentor-dashboard-ops/scripts/check-scope.sh` |