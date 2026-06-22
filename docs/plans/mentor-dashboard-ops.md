# Mentor dashboard ops — eng-reviewed plan

**Branch:** `mentor-dashboard-pr3`  
**Status:** In progress (PR3 active)  
**Eng review:** CLEARED  
**Version target:** v0.4.9.0 (PR3), v0.5.0.0 (PR5 Connect optional)

Implementation README: [mentor-dashboard-ops/README.md](./mentor-dashboard-ops/README.md)  
Guardrails: [mentor-dashboard-ops/GUARDRAILS.md](./mentor-dashboard-ops/GUARDRAILS.md)

## Expert journey (north star)

Mentors see per booking:

1. **Payment recorded** — PR1 ✓
2. **Session complete** — booking status on ledger row
3. **Transfer** — PR2 ✓ (`mentor_payout_lines`)
4. **Public listing** — PR3: slug, compliance, directory visibility

## PR stack

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Merge layout fix branch | Done (#45) |
| PR1 | Earnings truthfulness + card labels | Done (#47, v0.4.7.0) |
| PR2 | Manual payouts + transfer UI | Done (#48, v0.4.8.0) |
| PR3 | Listing/compliance visibility | **In progress** |
| PR4 | UI flex sweep | Pending |
| PR5 | Stripe Connect restore (deferred) | Pending |

## Decision ledger (PR3)

| # | Finding | Disposition |
|---|---------|-------------|
| 12 | Mentors cannot see listing/compliance state | Accepted → PR3 card |
| 13 | Self-serve `is_listed` toggle | Rejected — ops/admin only |
| 14 | Slug edit on dashboard | Deferred — read-only in PR3 |

**Session outcome:** invoke `/mentor-dashboard-ops` on `mentor-dashboard-pr3`

## Test ledger

| Test | Command |
|------|---------|
| Unit | `npm test -- mentor-listing-status` |
| E2E | `npm run test:e2e -- e2e/mentor-dashboard.spec.ts` |
| Scope | `docs/plans/mentor-dashboard-ops/scripts/check-scope.sh` |