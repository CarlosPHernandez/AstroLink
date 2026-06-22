# Mentor dashboard ops — eng-reviewed plan

**Branch:** `payouts-ui-dashboard`  
**Status:** In progress (PR1+)  
**Eng review:** CLEARED  
**Version target:** v0.4.7.0 (PR1–PR3), v0.4.8.0 (PR5 Connect optional)

Implementation README: [mentor-dashboard-ops/README.md](./mentor-dashboard-ops/README.md)  
Guardrails: [mentor-dashboard-ops/GUARDRAILS.md](./mentor-dashboard-ops/GUARDRAILS.md)

## Expert journey (north star)

Mentors see per booking:

1. **Payment recorded** — buyer paid; mentor 80% share in ledger (`transactions` on `payment_intent.succeeded`)
2. **Session complete** — booking status advances; same ledger row
3. **Transfer** — ops paid for that session (`mentor_payout_lines` in PR2)

## Architecture decisions

| ID | Decision |
|----|----------|
| D1 | `mentor_manual_payouts` + `mentor_payout_lines(transaction_id UNIQUE)` required |
| D2 | Summary cards: Recorded share / Awaiting transfer / Transferred |
| D3 | Ledger columns: Payment + Transfer per row |
| D4 | Admin payouts API separate from waitlist admin UI |
| D5 | Mentor reads via server components + service role; RLS on new tables |
| D6 | Idempotent admin mark-paid; refunds exclude from unpaid sum |

## PR stack

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Merge layout fix branch | Done on main via #45 + follow-up |
| PR1 | Earnings truthfulness + card labels | **In progress** |
| PR2 | Manual payouts migration + admin + mentor transfer UI | Pending |
| PR3 | Listing/compliance visibility | Pending |
| PR4 | UI flex sweep (consultation card, civil servant row) | Pending |
| PR5 | Stripe Connect restore (deferred) | Pending |

## Decision ledger

| # | Finding | Disposition |
|---|---------|-------------|
| 1 | Session transparency requires payout lines | Accepted |
| 2 | Pending capture card misleading | Accepted |
| 3 | Refunded rows skew totals | Accepted |
| 4 | Lump-sum payouts insufficient | Rejected |
| 5 | Admin UI on waitlist dashboard | Rejected |
| 6 | Connect in same release | Deferred → PR5 |
| 7 | Intro video upload on dashboard | Deferred |
| 8 | Calendar / availability | Deferred |

## NOT in scope

- Calendar / availability
- Stripe `payout.paid` webhook mirror (until PR5)
- Mentor dispute UI
- Dev-mode synthetic transactions

## Test ledger

| Test | Command |
|------|---------|
| Unit | `npm test -- mentor-earnings mentor-manual-payouts` |
| E2E | `npm run test:e2e -- e2e/mentor-dashboard.spec.ts` |
| Scope | `docs/plans/mentor-dashboard-ops/scripts/check-scope.sh` |