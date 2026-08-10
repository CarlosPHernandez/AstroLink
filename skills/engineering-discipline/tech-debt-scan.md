---
name: tech-debt-scan
description: >
  Project procedure for technical debt scans. Canonical agent skill for Grok:
  `.grok/skills/tech-debt-scan/SKILL.md`. Use when identifying dead code,
  dual paths, oversized modules, env debt, or simplification targets.
---

# Tech debt scan (project pointer)

**Invoke in Grok:** `/tech-debt-scan`  
**Skill file:** [`.grok/skills/tech-debt-scan/SKILL.md`](../../.grok/skills/tech-debt-scan/SKILL.md)

This folder’s [`SKILL.md`](./SKILL.md) is **engineering-discipline** (decision / test / simplification ledgers after reviews). Tech debt **scanning** is a separate workflow:

| Skill | Job |
|-------|-----|
| **tech-debt-scan** | Inventory routes/APIs/modules → prioritized debt ledger (read-only by default) |
| **engineering-discipline** | After any review/scan: disposition every item + tests + simplify |
| **`/health` (gstack)** | tsc / lint / test / knip composite score — no architecture narrative |

## When to run tech-debt-scan

- Before a cleanup sprint or “why is this hard to change?” conversation  
- After a large feature lands and dual paths may remain  
- When preparing YC/demo polish and you need honest surface-area truth  
- When the user says “find dead code”, “tech debt”, “what can we delete”

## Minimal checklist (if the full skill is unavailable)

1. List `src/app/**/page.tsx` and `route.ts`  
2. Largest 20 files under `src/` by line count  
3. Grep dual paths: `ENABLE_DEMO`, `SKIP_STRIPE`, legacy tokens, `api/dev`, `api/e2e`  
4. Score findings P0–P3 with path + evidence  
5. Close with **Decision ledger** from `SKILL.md` in this directory  

Do not auto-delete. Prefer small PRs after the user Accepts items.
