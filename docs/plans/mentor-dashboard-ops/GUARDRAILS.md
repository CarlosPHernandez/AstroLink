# Mentor dashboard ops — guardrails

**Active initiative:** mentor dashboard payouts + session transparency (v0.4.7.0)  
**Branch:** `payouts-ui-dashboard`

Agents **must** read this file and [README.md](./README.md) before editing. Run scope check after changes:

```bash
docs/plans/mentor-dashboard-ops/scripts/check-scope.sh
```

## Active PR gate

Only one PR slice is active at a time. Check [README.md](./README.md) for the current PR file list. Do not implement PR2+ while PR1 is in progress unless the README active PR section says otherwise.

## Allowed paths (by PR)

### PR1 — earnings truthfulness

```
src/lib/mentor-earnings-types.ts
src/lib/mentor-earnings.ts
src/lib/mentor-earnings.test.ts
src/app/dashboard/mentor/mentor-payouts-panel.tsx
e2e/mentor-dashboard.spec.ts
docs/plans/mentor-dashboard-ops/**
.grok/skills/mentor-dashboard-ops/**
.grok/skills/mentor-dashboard-ops-plan/**
.cursor/rules/mentor-dashboard-ops.mdc
CLAUDE.md
```

### PR2 — manual payouts (when active)

```
supabase/migrations/*mentor_manual_payout*
src/lib/mentor-manual-payouts.ts
src/lib/mentor-manual-payouts.test.ts
src/lib/database.types.ts
src/app/api/admin/mentor-payouts/**
src/app/dashboard/admin/**
src/app/dashboard/mentor/page.tsx
src/app/dashboard/mentor/mentor-payouts-panel.tsx
src/app/dashboard/mentor/mentor-dashboard-client.tsx
e2e/mentor-dashboard.spec.ts
e2e/admin-mentor-payouts.spec.ts
```

### PR3 — listing visibility (when active)

```
src/app/dashboard/mentor/page.tsx
src/app/dashboard/mentor/mentor-dashboard-client.tsx
e2e/mentor-dashboard.spec.ts
```

### PR4 — UI sweep (when active)

```
src/app/dashboard/mentor/mentor-consultation-card.tsx
src/app/dashboard/mentor/mentor-dashboard-client.tsx
```

### PR5 — Connect restore (when active)

```
src/app/api/mentor/stripe-connect/route.ts
src/app/api/mentor/stripe-connect/route.test.ts
.env.example
```

### Always allowed (any PR)

```
docs/plans/mentor-dashboard-ops/**
docs/plans/mentor-dashboard-ops.md
.grok/skills/mentor-dashboard-ops/**
.grok/skills/mentor-dashboard-ops-plan/**
```

## Forbidden without explicit user approval

| Area | Reason |
|------|--------|
| `src/app/booking/**`, `src/services/agents/booking-agent.ts` | Booking flow out of scope |
| `src/services/agents/payment-agent.ts` | Capture model frozen; PR1 fixes UI only |
| `src/app/api/webhooks/stripe/**` | Webhook changes are PR2+ refund edge cases only |
| `src/components/early-access/**`, `src/app/early-access/**` | Waitlist unrelated |
| `src/lib/transcript-translation/**` | D3 unrelated |
| `VERSION`, `CHANGELOG.md`, `package.json` version | Use `/ship` only |
| Unrelated mentor files (nav, actions, NF-1860) | Shipped in v0.4.6.0 |

## Workflow rules

1. **Read** [mentor-dashboard-ops.md](../mentor-dashboard-ops.md) and current PR section in README.
2. **Do not** refactor, rename, or "clean up" files outside allowed paths.
3. **Do not** change Stripe Connect route behavior until PR5.
4. **Do not** add migrations until PR2 is the active PR.
5. **Tests:** every behavior change needs a unit test; E2E updates only for visible copy/selectors.
6. **Run** `npm test` before committing.

## Escalation

If the task requires a forbidden path, stop and ask the user to expand GUARDRAILS.md for that PR.