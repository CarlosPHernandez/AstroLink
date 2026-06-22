---
name: mentor-dashboard-ops
description: >
  Implement mentor dashboard payouts and session transparency (PR1–PR5) on branch
  payouts-ui-dashboard. Enforces GUARDRAILS allowlists, runs scope check, and ships
  one PR slice at a time. Use when implementing earnings truthfulness, manual payouts,
  listing visibility, UI sweep, or Connect restore for the mentor dashboard. Triggers:
  /mentor-dashboard-ops, mentor dashboard ops, payouts UI, earnings truthfulness,
  mentor_payout_lines, manual payouts.
---

# Mentor dashboard ops — implementation

## Before any edit

1. Read `docs/plans/mentor-dashboard-ops/README.md` — note **active PR** and file list.
2. Read `docs/plans/mentor-dashboard-ops/GUARDRAILS.md` — do not touch forbidden paths.
3. Read `docs/plans/mentor-dashboard-ops.md` for architecture decisions (D1–D6).

## Workflow

1. **One PR at a time** — only implement the active PR in README. Do not start PR2+ while PR1 is active unless README says otherwise.
2. **Minimal diff** — no refactors, renames, or cleanup outside allowed paths.
3. **Tests** — every behavior change needs a unit test in the allowed lib file; E2E only for visible copy/selectors.
4. **Verify** before committing:
   ```bash
   npm test -- mentor-earnings
   docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
   ```
   Add `npm run test:e2e -- e2e/mentor-dashboard.spec.ts` when UI copy changes.

## Active PR quick reference

| PR | Focus | Key files |
|----|-------|-----------|
| PR1 | Earnings truthfulness | **Done** (#47) |
| PR2 | Manual payouts + lines | **ACTIVE** — migration, `mentor-manual-payouts.ts`, admin API, Transfer column |
| PR3 | Listing/compliance card | `mentor-dashboard-client.tsx`, `page.tsx` |
| PR4 | UI flex sweep | `mentor-consultation-card.tsx` |
| PR5 | Connect restore | `stripe-connect/route.ts` |

## Forbidden (stop and ask user)

- `payment-agent.ts`, booking flow, webhooks (except PR2 refund edges)
- `VERSION`, `CHANGELOG.md`, unrelated mentor files (NF-1860, nav)
- Migrations until PR2 is active
- Stripe Connect behavior until PR5

## Scope check

```bash
docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
```
(default `MENTOR_OPS_ACTIVE_PR=PR2`)

If scope fails, revert out-of-scope edits or ask user to expand GUARDRAILS.md.

## PR1 semantics (immediate capture)

- `transactions.status = completed` at booking → **Recorded** in ledger
- Summary: **Recorded share** / **Awaiting transfer** / **Transferred** (0 until PR2)
- Exclude `refunded` and `failed` from recorded totals; track `refundedPayoutCents` separately
- PR1: `awaitingTransferCents === recordedShareCents` (no payout lines yet)

## Session closeout

Run `skills/engineering-discipline/SKILL.md` closeout: decision ledger, test ledger, one next action.