<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

**Product:** AstroLink — single Next.js 16 app (`npm`, Node ≥ 20). Hosted Supabase project `vwoizjesyyygmokfqpyy` (no local Supabase stack in-repo). Public surfaces include a landing search hero (routes to `/experts?q=`) with a fixed five-expert directory grid, the full directory at `/experts` (approved+listed mentors from DB, category filters, name/role/expertise search via `?q=`, inline preview), profile pages at `/experts/[slug]` (bio, intro video via `ExpertIntroMedia`, modalities teaser, booking CTAs), and the Chris Sembroski campaign landing at `/talk-with-chris` (Stitch mobile layout on phones, HUD on tablet/desktop when `CHRIS_BOOKING_ENABLED=true`).

### Environment

1. Copy `.env.example` → `.env.local` and fill Supabase keys from the [project API settings](https://supabase.com/dashboard/project/vwoizjesyyygmokfqpyy/settings/api).
2. Set **`ENCRYPTION_KEY`** (`openssl rand -hex 32`) for session cookies (required in production). The app reads `ENCRYPTION_KEY` in `src/lib/crypto.ts`.
3. Local dev: `APP_MODE=full` and `ENABLE_DEMO_AUTH=true` (defaults in `.env.example`). Production waitlist: `APP_MODE=waitlist`; enable `ENABLE_DEMO_AUTH=true` only on preview/staging for ops admin access.
4. For local booking without Stripe: keep `SKIP_STRIPE_PAYMENTS=true` (default in `.env.example`). `SKIP_STRIPE_PAYMENTS` is hard-disabled in production builds. Stripe Connect payouts are deferred (platform-only immediate-capture at launch; mentors paid manually).

### Stripe environment split (critical)

- **Sandbox (AstroLink sandbox)**: Use for local dev + Vercel Preview. Create an isolated "AstroLink" sandbox in the Stripe Dashboard on the Helios Nexus account. Use its test keys (`sk_test_...` / `pk_test_...`). Local webhooks via `stripe listen`. See `docs/how-to/stripe-production-cutover.md`.
- **Production**: Stay on the same Helios Nexus account but switch to **Live** mode.
  - Create a narrow **Restricted API Key (RAK)** (`rk_live_...`) — this is your production `STRIPE_SECRET_KEY`.
  - Register the webhook endpoint in **Live** mode (exactly the four events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`).
  - Put the live `pk_live_...`, the RAK, and the live `whsec_...` **only** into Vercel **Production** environment variables.
  - Never put live keys into Preview or `.env.local`.
  - Full cutover checklist is in `docs/how-to/stripe-production-cutover.md`. Always do one small real transaction + refund before considering the cutover complete.

The code sets `metadata.app = 'astrolink'` on every PaymentIntent and filters defensively in the webhook handler for the shared account.
5. Optional: `E2E_STUB_LLM=true` for stubbed briefings; `OPENAI_API_KEY` / `GEMINI_API_KEY` for real APX-02.
6. Waitlist production (`APP_MODE=waitlist`, demo auth off): proxy blocks protected pages; `getSession()` also returns null for API routes so stale cookies cannot reach booking or dashboards.

Cloud Agent VMs often inject only `NEXT_PUBLIC_SUPABASE_URL`. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are required** for the landing page, demo auth, booking APIs, and Playwright E2E.

### Commands (see `README.md`)

| Task | Command |
|------|---------|
| Dev server | `npm run dev` → http://127.0.0.1:3000 |
| Dev server (phone on Wi‑Fi) | `npm run dev:lan` → https://\<LAN-IP\>:3000 — required for camera/mic on iPhone |
| Unit tests | `npm test` (no external services) |
| Lint | `npm run lint` (repo may have pre-existing ESLint errors) |
| Production build | `npm run build` |
| E2E | `npm run test:e2e` — Playwright starts its own dev server; **free port 3000** first |

### Running services

- **Only required process:** Next.js dev server (`npm run dev`). Use tmux for long-running dev (e.g. session `next-dev-server`).
- **E2E:** Playwright `webServer` runs `npm run dev -- --hostname 127.0.0.1` with `APP_MODE=full`, `ENABLE_DEMO_AUTH=true`, `SKIP_STRIPE_PAYMENTS=true`, `E2E_STUB_LLM=true`, and `DAILY_TRANSCRIPTION_ENABLED=false` (pins synthesis-on-meeting-end even if `.env.local` enables Daily transcription). Live captions API is covered by `e2e/live-captions.spec.ts` (stub LLM); dual-device caption UI needs `DAILY_TRANSCRIPTION_ENABLED=true` locally. Auth uses `POST /api/e2e/session`, not `/auth` presets.
- **Not in-repo:** Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) and Daily webhooks are optional for full payment/video flows.

### First-run tooling

After `npm ci`, install Playwright browsers once if running E2E: `npx playwright install chromium --with-deps`.

### Demo auth (local / E2E only)

With `ENABLE_DEMO_AUTH=true`, sign in at `/auth` with seed emails (`carlos@astrolink.ai`, `chris@astrolink.ai`, `admin@astrolink.ai`) or call `POST /api/e2e/session` with `{ "role": "mentee" | "mentor" | "admin" }`. Seed UUIDs must exist in Supabase (`20260531140100_seed_d1_dev.sql`).

### Repository layout

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js routes and API handlers (product surfaces) |
| `src/components/` | UI by feature (`early-access`, `experts`, `booking`, `session`, `chris-campaign`, `ui`) |
| `src/lib/` | Domain logic; grouped subfolders where mature (`waitlist/`, `transcript-translation/`, `chris-campaign/`, `supabase/`) |
| `src/services/agents/` | Booking, briefing, payment, and other agents |
| `docs/` | Diataxis docs; `docs/plans/` = pre-ship specs only |
| `design/` | Non-runtime design references (not imported by app code) |
| `claude-redesign/` | Source HTML mockups for the 2026-08 landing/expert-profile redesign (not imported by app code; see `claude-redesign/README.md`) |
| `e2e/` | Playwright specs |
| `supabase/migrations/` | Hosted DB migrations — do not rename |

### Engineering discipline (reviews & plans)

After plan reviews, critiques, or feature planning, read `skills/engineering-discipline/SKILL.md` and close with a decision ledger, test ledger, and simplification section.

### Transcript translation (D3)

Bilingual expert sessions (bidirectional live captions, post-call transcript panel, localized recap) are documented in `docs/d3-transcript-translation-roadmap.md`. Before editing transcript/translation code, read `skills/transcript-translation/SKILL.md`. Use `src/lib/transcript-translation/token-budget.ts` before sending transcript text to LLMs. Live captions use a dedicated `caption` LLM rate-limit scope (`LLM_MAX_CAPTION_*` in `.env.example`). Extend `src/lib/llm.ts` for APX-06 — do not add Vercel AI SDK without updating the AI SDK review doc.

**Post-call transcript durability:** Live captions and `DAILY_TRANSCRIPTION_ENABLED` are not enough. Daily domain/room must have `enable_transcription_storage=true` or WebVTT download fails forever after hang-up. Incident + preflight: `docs/explanation/daily-transcription-storage-incident.md`, `docs/how-to/daily-transcription-storage-preflight.md`.
