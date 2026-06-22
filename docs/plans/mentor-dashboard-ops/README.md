# Mentor dashboard ops — implementation guide

Agents and humans: read this before editing code on branch `mentor-dashboard-pr3`.

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

## Current PR: PR3 — listing & compliance visibility

**Goal:** Mentors see whether they are listed on `/experts`, their public slug, and compliance status with a clear path to fix blockers.

**Prerequisite:** PR2 merged to main via #48 (v0.4.8.0).

### Files (PR3 only)

```
src/app/dashboard/mentor/page.tsx
src/app/dashboard/mentor/mentor-dashboard-client.tsx
src/app/dashboard/mentor/mentor-listing-card.tsx   # new
src/lib/mentor-listing-status.ts                   # new (pure helpers + tests)
src/lib/mentor-listing-status.test.ts
e2e/mentor-dashboard.spec.ts
docs/plans/mentor-dashboard-ops/**
```

### UI (Profile tab)

New **Public listing** card showing:

| Field | Source |
|-------|--------|
| Compliance status | `mentors.compliance_status` (human label) |
| Listed on directory | `mentors.is_listed` |
| Public URL | `/experts/{slug}` when `slug` set |
| Preview link | Opens expert profile in new tab when listed |

Copy guidance per status:

- `approved` + listed → “Live on the expert directory”
- `approved` + not listed → “Approved but not listed — contact ops”
- `pending_review` / `awaiting_human_approval` → “Under review”
- `document_required` → “NF-1860 or compliance docs needed”
- `rejected` → “Not approved for listing”

### Acceptance criteria

- [ ] `page.tsx` loads `slug`, `is_listed`, `compliance_status` for mentor
- [ ] Listing card visible on Profile tab with status + directory link when applicable
- [ ] Preview link to `/experts/[slug]` only when `is_listed && slug`
- [ ] Unit tests for status label / preview eligibility helpers
- [ ] E2E asserts listing card visible for Chris (seed: approved + listed)
- [ ] Scope check passes

### Verify

```bash
docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
npm test -- mentor-listing-status
npm run test:e2e -- e2e/mentor-dashboard.spec.ts
```

## PR1 — done (#47, v0.4.7.0)

Earnings truthfulness + ops guardrails.

## PR2 — done (#48, v0.4.8.0)

Manual payouts + Transfer column + admin mark-paid.

## PR4 preview (do not start until PR3 merged)

- UI flex sweep (`mentor-consultation-card`, civil servant row)