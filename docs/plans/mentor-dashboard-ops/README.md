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

## Current PR: PR2 — manual payouts + transfer visibility

**Goal:** Ops can mark per-session payouts as transferred; mentors see Transfer status per ledger row and accurate summary buckets.

**Prerequisite:** PR1 merged to main via #47 (v0.4.7.0).

### Files (PR2 only)

```
supabase/migrations/*mentor_manual_payout*
src/lib/mentor-manual-payouts.ts
src/lib/mentor-manual-payouts.test.ts
src/lib/mentor-earnings-types.ts      # transferStatus on row
src/lib/mentor-earnings.ts            # join payout_lines; fix summary buckets
src/lib/mentor-earnings.test.ts
src/lib/database.types.ts             # regen after migration
src/app/api/admin/mentor-payouts/route.ts
src/app/api/admin/mentor-payouts/route.test.ts
src/app/dashboard/admin/admin-dashboard-client.tsx
src/app/dashboard/admin/mentor-payouts-panel.tsx   # new
src/app/dashboard/mentor/page.tsx
src/app/dashboard/mentor/mentor-payouts-panel.tsx  # Transfer column
src/app/dashboard/mentor/mentor-dashboard-client.tsx  # only if props change
e2e/mentor-dashboard.spec.ts
e2e/admin-mentor-payouts.spec.ts
docs/plans/mentor-dashboard-ops/**
```

### Schema (migration)

`mentor_manual_payouts` — batch header when ops sends a bank transfer:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `mentor_id` | uuid FK → mentors | |
| `total_cents` | integer | Sum of lines in batch |
| `reference_note` | text nullable | Bank memo / wire ref |
| `paid_at` | timestamptz | When transfer sent |
| `created_by_admin_id` | uuid FK → users | Admin who marked paid |
| `created_at` | timestamptz | |

`mentor_payout_lines` — one row per session paid (D1):

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `payout_id` | uuid FK → mentor_manual_payouts | |
| `transaction_id` | uuid FK → transactions **UNIQUE** | Idempotent mark-paid |
| `amount_cents` | integer | Copy of `mentor_payout_cents` at mark time |
| `created_at` | timestamptz | |

RLS: enabled; mentor/admin reads via service role in server components (D5). No anon policies.

Suggested migration name: `20260621120000_mentor_manual_payouts.sql`

### API — `POST /api/admin/mentor-payouts`

Admin-only (`requireApiRole('admin')`). Body:

```json
{
  "mentorId": "uuid",
  "transactionIds": ["uuid", "..."],
  "referenceNote": "optional string",
  "paidAt": "optional ISO datetime"
}
```

Behavior (D6):

1. Validate all `transactionIds` belong to `mentorId`, `status = completed`, not refunded.
2. Reject if any id already has a `mentor_payout_lines` row (idempotent — return 409 with existing payout id).
3. Insert `mentor_manual_payouts` + lines in one transaction.
4. Write `audit_log` event `MENTOR_MANUAL_PAYOUT_CREATED`.

`GET /api/admin/mentor-payouts?mentorId=` — list unpaid completed transactions + mentor awaiting total (admin UI picker).

### Mentor UI

- Ledger: add **Transfer** column — `Awaiting` / `Transferred` / `—` (refunded/pending/failed).
- Summary cards: `awaitingTransferCents` = recorded minus transferred; `transferredCents` = sum of payout lines.
- Extend `MentorEarningRow` with `transferStatus: 'awaiting' | 'transferred' | 'not_applicable'`.

### Admin UI

New **Mentor payouts** section on `/dashboard/admin` (D4 — separate API, not buried in waitlist metrics):

1. Mentor picker (approved mentors with awaiting balance > 0).
2. Checkbox list of unpaid completed transactions.
3. Optional reference note + Mark paid button.

### Acceptance criteria

- [x] Migration creates tables + `transaction_id UNIQUE` on lines
- [x] `markMentorTransactionsPaid` is idempotent (second call for same tx → error, no duplicate line)
- [x] Refunded / pending / failed transactions cannot be marked paid
- [x] Mentor ledger shows Transfer column; summary buckets reconcile
- [x] Admin can mark one or more sessions paid; audit log written
- [x] Unit tests: `mentor-manual-payouts`, updated `mentor-earnings`, admin API route
- [x] E2E: `admin-mentor-payouts.spec.ts` + mentor dashboard transfer assertion

### Verify

```bash
MENTOR_OPS_ACTIVE_PR=PR2 docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
npm test -- mentor-earnings mentor-manual-payouts
npm run test:e2e -- e2e/admin-mentor-payouts.spec.ts e2e/mentor-dashboard.spec.ts
```

## PR1 — done (merged #47)

Earnings truthfulness: Recorded share / Awaiting transfer / Transferred cards; Payment column; refunds excluded from totals.

## PR3 preview (do not start until PR2 merged)

- Listing/compliance visibility card on mentor dashboard
- `slug`, `is_listed` surfacing

## Data flow

```
payment_intent.succeeded → transactions (completed)
                              ↓
                    listMentorEarnings + payout_lines join
                              ↓
              admin POST /api/admin/mentor-payouts
                              ↓
                    Transfer column → Transferred
                    summary.awaitingTransferCents decreases
```