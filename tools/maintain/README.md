# astro-maintain

**Keep AstroLink’s money and AI pipes from quietly rotting.**

A small CLI that checks the external services we actually ship on (OpenAI, Stripe, Supabase, Daily), explains what changed in plain language, and can open a PR with the minimal fix.

No dashboard. No multi-tenant platform. Just a tool you run when you care whether production will break next week.

---

## Why this exists (30 seconds)

AstroLink depends on third-party SDKs that move fast — especially **OpenAI** (model names, parameters, response shapes). Waiting until something fails in a paid session is an expensive way to learn about deprecations.

`astro-maintain` answers three questions:

1. **What do we use?** (real imports, models, call sites in *this* repo)
2. **What changed upstream?** (npm + GitHub releases)
3. **Does it matter for us?** If yes → smallest safe patch + human-readable why

Every command also prints a **Tech → CEO** block: business impact, risk, and the decision you need — not a stack dump.

---

## Setup

From the monorepo root:

```bash
cd tools/maintain
npm install
cd ../..
```

Needs **Node ≥ 20**. For LLM analysis / code migrations, set `OPENAI_API_KEY` (reads root `.env.local` automatically).

Optional:

| Env | Purpose |
|-----|---------|
| `OPENAI_API_KEY` | Analyze release notes + generate migrations |
| `MAINTAIN_MODEL` | Override model (default: `OPENAI_FLASH_MODEL` or `gpt-4o-mini`) |
| `OPENAI_FLASH_MODEL` | Same as product flash model |

---

## Commands

### Check — “is anything on fire?”

```bash
npx tsx tools/maintain/src/index.ts check openai
npx tsx tools/maintain/src/index.ts check all
npx tsx tools/maintain/src/index.ts check openai --ceo          # founder summary only
npx tsx tools/maintain/src/index.ts check openai --skip-llm     # no API spend
```

**Tech → CEO:** *Do we need to spend engineering time this sprint, or can we ignore this?*

### Migrate — “fix the lag, carefully”

```bash
# Plan only (recommended first)
npx tsx tools/maintain/src/index.ts migrate openai --dry-run

# Apply patches + package.json bumps to the working tree
npx tsx tools/maintain/src/index.ts migrate openai

# Apply, branch, commit, open GitHub PR (needs `gh` auth)
npx tsx tools/maintain/src/index.ts migrate openai --pr
```

**Tech → CEO:** *Here’s the smallest change that keeps AI features working; here’s the risk if we merge wrong.*

### Status — “what did we learn last time?”

```bash
npx tsx tools/maintain/src/index.ts status
npx tsx tools/maintain/src/index.ts status --ceo
```

State is stored in **`.astro-maintain/status.json`** (gitignored locally if you want — safe to commit or not).

---

## What “done” looks like for OpenAI (v0)

| Capability | Status |
|------------|--------|
| Detect `openai` package version + models + `src/lib/llm.ts` usage | ✅ |
| Fetch npm latest + GitHub release notes | ✅ |
| Deterministic signals (version lag, legacy models) | ✅ |
| LLM impact analysis | ✅ (needs key) |
| Propose / apply migration + CEO summary | ✅ |
| Open PR via `gh` | ✅ (`--pr`) |
| Stripe / Supabase / Daily full migrate | 🟡 check only |

OpenAI is the fully wired path. Other providers detect version lag; full migrate is next.

---

## How it thinks about OpenAI in AstroLink

Almost all OpenAI traffic goes through **`src/lib/llm.ts`**:

- `chat.completions.create`
- Structured output via `response_format: json_schema`
- Models: `OPENAI_FLASH_MODEL` / `OPENAI_PRO_MODEL` (defaults `gpt-4o-mini` / `gpt-4o`)
- Callers: briefing, booking match, compliance, session recap, live captions / translation

The tool optimizes for **that** surface — not the entire OpenAI product catalog.

---

## GitHub Action (later)

Run the same binary in CI:

```yaml
# sketch — not shipped
- run: cd tools/maintain && npm ci
- run: npx tsx tools/maintain/src/index.ts check all --ceo
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

Wire a scheduled workflow when you’re ready to get weekly drift reports without remembering to run it.

---

## Safety rails

- Migrations only write under `src/`, `docs/`, `e2e/`, `scripts/`, `package.json`, `.env.example`
- No deletes in v0
- `--dry-run` never touches the tree
- `--pr` only after a successful apply; review like any other PR

---

## YC-style product one-liner

> **Before:** You find out OpenAI broke your briefs when a mentee pays and the room fails.  
> **After:** Once a week you run one command, get a yes/no + a PR, and ship the boring upgrade before customers feel it.

That’s the whole product.
