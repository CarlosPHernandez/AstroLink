---
name: mentor-dashboard-ops-plan
description: >
  Plan, refine, and eng-review mentor dashboard ops (payouts, session transparency,
  listing visibility). Updates plan docs and GUARDRAILS without implementing code unless
  asked. Use when refining scope, updating PR stack, running eng review follow-ups, or
  documenting decisions for v0.4.7.0. Triggers: /mentor-dashboard-ops-plan, mentor
  dashboard plan, payouts plan review, refine mentor ops scope.
---

# Mentor dashboard ops — planning & refinement

## When to use

- Scoping a new PR slice or changing active PR in README
- Eng-review follow-ups (session journey, line-item payouts, card labels)
- Updating decision/test ledgers after review
- Expanding GUARDRAILS allowlist (with user approval)

## Canonical docs (edit these)

| File | Purpose |
|------|---------|
| `docs/plans/mentor-dashboard-ops.md` | Master plan, PR stack, decision ledger |
| `docs/plans/mentor-dashboard-ops/README.md` | Active PR, acceptance criteria, verify commands |
| `docs/plans/mentor-dashboard-ops/GUARDRAILS.md` | Allowed/forbidden paths per PR |
| `docs/plans/mentor-dashboard-ops/scripts/check-scope.sh` | Allowlist regex per PR |

## Planning workflow

1. **North star** — per-booking journey: Payment recorded → Session complete → Transfer status.
2. **Reject lump-sum** — `mentor_payout_lines` with `transaction_id UNIQUE` (D1).
3. **PR stack** — keep PR1–PR5 sequential; one active PR in README at a time.
4. **Eng review** — for architecture changes, invoke `/plan-eng-review` or read existing cleared review in master plan.
5. **Closeout** — update decision ledger + test ledger in `mentor-dashboard-ops.md`; read `skills/engineering-discipline/SKILL.md`.

## Changing active PR

When PR N merges:

1. Mark PR N **Done** in `mentor-dashboard-ops.md` table.
2. Update README **Current PR** section with PR N+1 files and acceptance criteria.
3. Add PR N+1 paths to `check-scope.sh` if not already present.
4. Do **not** implement code in planning mode unless user explicitly asks.

## Out of scope (defer explicitly)

- Calendar / availability
- Intro video upload on dashboard
- Stripe `payout.paid` webhook (until PR5)
- Full-app i18n

## Handoff to implementation

When plan is ready: tell user to invoke `/mentor-dashboard-ops` on branch `payouts-ui-dashboard`.