# Mentor dashboard ops — implementation guide

Agents and humans: read this before editing code on branch `payouts-ui-dashboard`.

## Quick links

| Doc | Purpose |
|-----|---------|
| [../mentor-dashboard-ops.md](../mentor-dashboard-ops.md) | Full plan + decision ledger |
| [GUARDRAILS.md](./GUARDRAILS.md) | Allowed paths and forbidden changes |
| [../../how-to/mentor-dashboard-payouts-plan.md](../../how-to/mentor-dashboard-payouts-plan.md) | Original payouts how-to (update when PR2 lands) |

## Skills (invoke before work)

| Skill | When |
|-------|------|
| `/mentor-dashboard-ops` | Implementing PR1–PR5 on this initiative |
| `/mentor-dashboard-ops-plan` | Refining scope, eng review follow-ups, updating plan docs |

Repo copies: `.grok/skills/mentor-dashboard-ops/SKILL.md`, `.grok/skills/mentor-dashboard-ops-plan/SKILL.md`

## Current PR: PR1 — earnings truthfulness

**Goal:** Summary cards and aggregation match immediate-capture reality; refunds excluded from totals.

### Files (PR1 only)

- `src/lib/mentor-earnings-types.ts`
- `src/lib/mentor-earnings.ts`
- `src/lib/mentor-earnings.test.ts`
- `src/app/dashboard/mentor/mentor-payouts-panel.tsx`
- `e2e/mentor-dashboard.spec.ts` (label assertions only)

### Acceptance criteria

- [x] `refunded` / `failed` rows excluded from recorded share and session count
- [x] `refundedPayoutCents` tracked separately
- [x] Cards labeled: **Recorded share**, **Awaiting transfer**, **Transferred**
- [x] Ledger shows **Payment** status per row (Recorded / Refunded / Pending)
- [x] All unit tests pass; mentor E2E smoke passes (run E2E before merge)

### Verify

```bash
npm test -- mentor-earnings
npm run test:e2e -- e2e/mentor-dashboard.spec.ts
docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
```

## PR2 preview (do not start until PR1 merged)

- Migration: `mentor_manual_payouts`, `mentor_payout_lines`
- `src/lib/mentor-manual-payouts.ts`
- `src/app/api/admin/mentor-payouts/route.ts`
- Admin payout panel + mentor Transfers table

## Data flow

```
payment_intent.succeeded → transactions (completed)
                              ↓
                    listMentorEarnings → dashboard ledger
                              ↓
              PR2: admin mark-paid → mentor_payout_lines
                              ↓
                    Transfer column → Transferred
```