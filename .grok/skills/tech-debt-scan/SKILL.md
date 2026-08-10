---
name: tech-debt-scan
description: >
  Scan the AstroLink codebase for technical debt: dead code, dual paths, oversized
  modules, env/mode matrix risk, unused routes/APIs, mock leftovers, and simplification
  targets. Produces a prioritized ledger with dispositions. Use when the user asks
  for tech debt, debt scan, dead code audit, simplification audit, "what's rotting",
  cleanup candidates, or runs /tech-debt-scan. Complements /health (tool scores only)
  and engineering-discipline (review closeout). Does NOT auto-fix code.
---

# Tech Debt Scan (AstroLink)

You are a staff engineer doing a **read-only debt audit**. Goal: surface debt the team can act on — not a generic lecture, not a drive-by rewrite.

**HARD GATE:** Do **not** delete, refactor, or "clean up" code unless the user explicitly asks to implement items after the report. Default is report + ledger only.

## When to use

| Need | Use this | Not this |
|------|----------|----------|
| Dead routes, dual systems, oversized files, env debt | **`/tech-debt-scan`** | |
| tsc / lint / test / knip scores | `/health` | this skill alone |
| After a PR review: decisions + tests + simplify | `engineering-discipline` | this skill alone |
| Diff-only ship gate | `/review` | full-repo debt |

You may **run `/health` first** (or note last health score) as quantitative context, then do the semantic scan below.

---

## Step 0: Scope

Ask once if unclear (otherwise default to **B**):

**A)** Full repo  
**B)** Hot paths only — `src/app/`, `src/lib/`, `src/services/`, `src/components/` (recommended)  
**C)** Named area only — user supplies path (e.g. booking, mentor dashboard, landing)

Note branch: `git branch --show-current`. Prefer current tree over outdated assumptions.

---

## Step 1: Inventory (facts before opinions)

Gather structure with tools (parallel where possible):

```bash
# Routes & APIs
find src/app -type f \( -name 'page.tsx' -o -name 'route.ts' -o -name 'layout.tsx' \) | sort

# Large files (debt magnets)
find src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -path '*/node_modules/*' -exec wc -l {} + | sort -rn | head -40

# Env / mode surface
rg -n "process\.env\.|APP_MODE|ENABLE_DEMO|SKIP_STRIPE|E2E_STUB" src --glob '*.{ts,tsx}' | head -80

# Dev / E2E / stub surfaces
rg -n "api/dev|api/e2e|ENABLE_DEMO|stub" src --glob '*.{ts,tsx}' | head -40
```

Also list:

- `src/services/agents/*` (agent surface)
- `supabase/migrations/` count (schema debt signal only — do not rename migrations)
- Recent churn: `git log --since=30.days --name-only --format="" | sort | uniq -c | sort -rn | head -25`

---

## Step 2: Debt categories (scan each)

For each finding: **path**, **evidence** (file:line or command), **severity**, **fix cost**, **risk if ignored**.

### D1 — Dead or unreachable code
- Unreferenced exports, components, pages never linked from nav/CTAs
- Routes behind flags that are never true in any env
- Duplicate helpers (same logic in `src/lib/` twice)

### D2 — Dual / legacy paths
- Old and new systems both live (tokens, auth, booking fulfill, waitlist vs full)
- AstroLink watchlist from `skills/engineering-discipline/SKILL.md`:
  - `NODE_ENV === 'production'` vs `APP_MODE` / preview
  - Legacy Daily tokens vs per-request mint
  - Demo auth vs real auth surfaces
  - Dev APIs callable outside local

### D3 — Size & cohesion
- Files **> ~500 lines** without a clear module boundary
- God components / agents that mix HTTP, DB, LLM, and UI concerns

### D4 — Env & mode matrix
- Flags with unclear ownership or overlapping meaning
- Production-unsafe stubs (`E2E_STUB_LLM`, `SKIP_STRIPE` not hard-disabled in prod)
- Missing documentation in `.env.example` for live flags

### D5 — Test debt
- Logic in routes without extracted `src/lib/` tests
- Critical money/auth/session paths with no unit coverage
- Flaky or skipped tests that hide real gaps

### D6 — Product surface debt
- Landing / marketing experiments half-reverted
- Empty states or waitlist shells that confuse ops
- Features shipped only in docs/plans, not code (or vice versa)

### D7 — Docs & ops drift
- `docs/plans/` vs shipped code
- How-tos that reference removed APIs
- VERSION/CHANGELOG lag is **not** debt unless user is mid-release

---

## Step 3: Severity rubric

| Severity | Meaning |
|----------|---------|
| **P0** | Prod risk (auth, payments, data loss, secret leakage, wrong mode in prod) |
| **P1** | High cost of delay (blocks features, confuses every PR, dual paths) |
| **P2** | Cleanup that pays off within a quarter (size, dead exports, docs) |
| **P3** | Nice-to-have / style / distant future |

**Do not invent P0.** If unsure, P1 or P2.

---

## Step 4: Output report (required format)

```markdown
# Tech debt scan — <date> — <branch> — scope: <A|B|C>

## Snapshot
- Composite health (if /health ran): X/10 or "not run"
- Largest files: top 5 with line counts
- Route count / API route count (approx)

## Findings

| ID | Sev | Category | Location | Evidence | Suggested action | Est. effort |
|----|-----|----------|----------|----------|------------------|-------------|
| TD-1 | P1 | D2 dual path | `src/...` | … | Remove / merge / document | S/M/L |

## Recommended attack order
1. … (why first)
2. …
3. …

## Explicit non-goals this scan
- … (what you did *not* recommend rewriting)

## Decision ledger (for engineering-discipline)

| # | Finding | Disposition | Owner / next step |
|---|---------|-------------|-------------------|
| 1 | TD-… | Needs option / Deferred / … | … |

**Session outcome:** [report only / pick top N to implement / open issues]
```

Effort: **S** < half day, **M** 1–2 days, **L** multi-day / multi-PR.

---

## Step 5: Close with engineering-discipline

After the report, apply `skills/engineering-discipline/SKILL.md` closeout:

- Every finding gets a disposition (**Accepted / Rejected / Deferred / Needs option**)
- Do not leave "we should clean this up" without a next step
- If user wants fixes: implement **only Accepted** items, one PR-sized batch at a time

Optional: write durable report under  
`docs/explanation/tech-debt-scan-YYYY-MM-DD.md`  
**only if** the user asks to save it.

---

## AstroLink-specific hotspots (always check)

1. **Booking / payments** — Stripe skip paths, fulfill dual paths, lead time rules  
2. **Session / Daily** — token mint, transcript storage, transcription flags  
3. **Auth** — demo vs production waitlist, cookie session, proxy blocks  
4. **Landing** — experiments vs single hero; unused multi-expert helpers  
5. **Agents** — `src/services/agents/*` vs thin route handlers  
6. **Transcript translation** — dual caption paths, LLM rate scopes  

---

## Anti-patterns (do not do)

- Mass `rm` of "unused" without import graph + runtime route proof  
- Renaming Supabase migrations  
- Big-bang rewrites as the only recommendation  
- Flagging style preferences as P0  
- Confusing "I would have designed it differently" with debt  

---

## Relationship to other skills

```
/health              → quantitative CI score
/tech-debt-scan      → qualitative architecture/product debt (this skill)
engineering-discipline → disposition + tests + simplification on any review
/review              → pre-merge diff only
```

After scan, user may say "fix TD-1 and TD-3" → implement those only; re-run scan later.
