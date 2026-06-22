# Mentor dashboard ops — eng-reviewed plan

**Branch:** `payouts-ui-dashboard`  
**Status:** In progress (PR2 active)  
**Eng review:** CLEARED (PR1); PR2 extends D1/D6 without re-review unless schema changes  
**Version target:** v0.4.8.0 (PR2), v0.4.9.0 (PR3), v0.5.0.0 (PR5 Connect optional)

Implementation README: [mentor-dashboard-ops/README.md](./mentor-dashboard-ops/README.md)  
Guardrails: [mentor-dashboard-ops/GUARDRAILS.md](./mentor-dashboard-ops/GUARDRAILS.md)

## Expert journey (north star)

Mentors see per booking:

1. **Payment recorded** — buyer paid; mentor 80% share in ledger (`transactions` on `payment_intent.succeeded`) — **PR1 ✓**
2. **Session complete** — booking status advances; same ledger row
3. **Transfer** — ops paid for that session (`mentor_payout_lines` in **PR2**)

## Architecture decisions

| ID | Decision |
|----|----------|
| D1 | `mentor_manual_payouts` + `mentor_payout_lines(transaction_id UNIQUE)` required |
| D2 | Summary cards: Recorded share / Awaiting transfer / Transferred |
| D3 | Ledger columns: Payment + Transfer per row |
| D4 | Admin payouts API separate from waitlist admin UI |
| D5 | Mentor reads via server components + service role; RLS on new tables |
| D6 | Idempotent admin mark-paid; refunds exclude from unpaid sum |
| D7 | `amount_cents` on payout line snapshots mentor share at mark time |
| D8 | Admin UI lists only `completed` transactions without a payout line |

## PR stack

| PR | Scope | Status |
|----|-------|--------|
| PR0 | Merge layout fix branch | Done (#45) |
| PR1 | Earnings truthfulness + card labels | **Done** (#47, v0.4.7.0) |
| PR2 | Manual payouts migration + admin + mentor transfer UI | **Ready to ship** |
| PR3 | Listing/compliance visibility | Pending |
| PR4 | UI flex sweep (consultation card, civil servant row) | Pending |
| PR5 | Stripe Connect restore (deferred) | Pending |

## Decision ledger

| # | Finding | Disposition |
|---|---------|-------------|
| 1 | Session transparency requires payout lines | Accepted |
| 2 | Pending capture card misleading | Accepted → shipped PR1 |
| 3 | Refunded rows skew totals | Accepted → shipped PR1 |
| 4 | Lump-sum payouts insufficient | Rejected |
| 5 | Admin UI on waitlist dashboard | Rejected — separate section, same `/dashboard/admin` page OK |
| 6 | Connect in same release | Deferred → PR5 |
| 7 | Intro video upload on dashboard | Deferred |
| 8 | Calendar / availability | Deferred |
| 9 | Batch header + line items (not lump-sum only) | Accepted → PR2 schema |
| 10 | 409 on duplicate mark-paid (idempotency) | Accepted → PR2 API |
| 11 | No Stripe payout webhook mirror yet | Deferred → PR5 |

**Session outcome (PR2 planning):** implement on branch — invoke `/mentor-dashboard-ops`

## NOT in scope

- Calendar / availability
- Stripe `payout.paid` webhook mirror (until PR5)
- Mentor dispute UI
- Dev-mode synthetic transactions
- Partial payout amounts (line amount = full `mentor_payout_cents`)

## Test ledger

| Test | Command |
|------|---------|
| Unit | `npm test -- mentor-earnings mentor-manual-payouts` |
| Admin API | `npm test -- mentor-payouts` (route.test.ts) |
| E2E mentor | `npm run test:e2e -- e2e/mentor-dashboard.spec.ts` |
| E2E admin | `npm run test:e2e -- e2e/admin-mentor-payouts.spec.ts` |
| Scope | `MENTOR_OPS_ACTIVE_PR=PR2 docs/plans/mentor-dashboard-ops/scripts/check-scope.sh` |

## Simplification (PR2)

- **Adds:** line-item payout tracking — removes ops reliance on spreadsheet + misleading "all awaiting" totals
- **Does not add:** Stripe Connect automation, mentor-initiated payout requests, or partial transfers
- **Reuses:** existing `transactions` ledger; admin auth pattern from `/api/admin/compliance`