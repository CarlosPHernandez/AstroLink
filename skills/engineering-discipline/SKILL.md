---
name: engineering-discipline
description: >-
  Close review loops with explicit decisions, expand test coverage for planned
  checks, and pair every feature plan with simplification. Use after plan reviews,
  CEO/eng/design critiques, mock-data cleanup, rollout-risk analysis, or when
  the user asks to sharpen engineering discipline, testing depth, or
  decomposition. Invoke before shipping plans that only add code.
---

# Engineering Discipline (YC growth areas)

Three habits to apply on every plan review, critique, or feature session. Do not end a review with findings only — end with decisions, tests, and simplification.

## When to invoke

- After `/plan-eng-review`, `/plan-ceo-review`, `/review`, mock-data cleanup, or rollout-risk critique
- When a session surfaces risks but no follow-up (accepted / rejected / deferred / needs option)
- When adding features, routes, env guards, or demo/E2E behavior
- When `test_quality`, test-to-code ratio, or oversized files are mentioned

---

## 1. Decision ledger (review closeout)

**Iron rule:** Every critique item gets a disposition before the session ends. No open-ended "we should consider…" without a next step.

### Dispositions (use exactly one per item)

| Status | Meaning |
|--------|---------|
| **Accepted** | Will implement in this branch/session; name the file or task |
| **Rejected** | Will not do; one-line reason |
| **Deferred** | Not now; link to issue, plan section, or explicit trigger |
| **Needs option** | Blocked on a choice; list 2–3 options and the deciding question |

### Template — paste at end of every review

```markdown
## Decision ledger

| # | Finding | Disposition | Owner / next step |
|---|---------|-------------|-------------------|
| 1 | … | Accepted | … |
| 2 | … | Rejected | … |
| 3 | … | Deferred | Track in … |
| 4 | … | Needs option | A vs B — user picks … |

**Session outcome:** [ship / revise plan / spike / stop]
```

### AstroLink patterns (from past sessions)

When critique touches these, force a disposition — do not leave implicit:

- `NODE_ENV === 'production'` guards vs preview/local prod builds (`APP_MODE`, `ENABLE_DEMO_AUTH`)
- Route-level dead states (empty data, waitlist vs full, missing booking)
- Dev-only APIs (`/api/dev/*`, `/api/e2e/*`) and whether preview/staging may call them
- Legacy columns (`mentee_token`, `mentor_token`) vs per-request Daily tokens
- `E2E_STUB_LLM` and other env stubs that must not leak to production

If disposition is **Needs option**, ask one focused question — not a laundry list.

---

## 2. Test depth (planned checks → real tests)

**Iron rule:** Every planned verification from a review becomes at least one named test (unit or E2E) in the same PR or an immediate follow-up commit. "We'll test manually" is only valid with a **Deferred** ledger row and a ticket.

### Priority order (AstroLink)

1. **Auth & access** — `booking-access`, session roles, join authorization (`/session/[bookingId]`)
2. **Env & mode matrix** — `app-mode`, demo auth, `SKIP_STRIPE_PAYMENTS`, production guards
3. **Token / video** — Daily provision, legacy token clearing, booking fulfill paths
4. **API contracts** — early-access, book/fulfill, webhooks (happy + one failure path)
5. **E2E only when** UI flow or multi-service integration; prefer `src/lib/*.test.ts` for logic

### Test expansion checklist

Before marking a feature done:

```markdown
## Test ledger

| Planned check (from review/plan) | Test file | Status |
|----------------------------------|-----------|--------|
| Mentee cannot join mentor booking | `booking-access.test.ts` | add / exists |
| Preview build with demo auth | `app-mode.test.ts` or E2E | … |
| … | … | … |
```

### Commands

```bash
npm test                    # unit — run after adding tests
npm run test:e2e            # when E2E row added; free port 3000
```

### Minimum bar for new `src/lib/` modules

- Pure functions / guards: unit test in colocated `*.test.ts`
- New API route: test handler logic via extracted function in `src/lib/`, not only Playwright
- Env-dependent branches: table-driven tests with `vi.stubEnv` (see `booking-payments.test.ts`)

---

## 3. Simplification pressure (add + subtract)

**Iron rule:** Every feature plan includes a **Simplification** section as prominent as **Risks**. Match rollout/demo risk rigor with decomposition rigor.

### Simplification ledger (required in plans)

```markdown
## Simplification

| Action | Target | Why now |
|--------|--------|---------|
| Remove | … | superseded by … |
| Split | … | file >500 lines / mixed concerns |
| Merge | … | duplicate logic |
| Delete dead | … | unused route, mock, env branch |
```

### Triggers to propose simplification

- File would exceed **~500 lines** — split by responsibility (`src/lib/` vs `src/services/` vs route colocation)
- **Deletion ratio** stays low — ask what mock data, flags, or legacy paths this feature replaces
- **0 architectural components** — name the module boundary (e.g. `booking-access`, `daily`, `session`) when adding routes
- Adding a new env flag — list an old flag or branch to remove or narrow

### Pair with risk discovery

| Risk found | Ask in parallel |
|------------|-----------------|
| Demo auth in preview | Can we remove a duplicate guard elsewhere? |
| New waitlist route | What landing/mock route gets deleted? |
| New Supabase column | What JSON/mock field goes away? |

---

## Session closeout (all three pillars)

End planning or review sessions with this block:

```markdown
## Engineering discipline closeout

**Decisions:** N accepted, N rejected, N deferred, N need option
**Tests:** N new/updated test files named
**Simplification:** N removals/splits named (or explicit "none — justify")
**Next action:** [single concrete step]
```

Do not start implementation until **Needs option** rows are resolved or explicitly deferred with a default.
