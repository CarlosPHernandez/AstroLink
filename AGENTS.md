<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

**Product:** AstroLink — single Next.js 16 app (`npm`, Node ≥ 20). Hosted Supabase project `vwoizjesyyygmokfqpyy` (no local Supabase stack in-repo).

### Environment

1. Copy `.env.example` → `.env.local` and fill Supabase keys from the [project API settings](https://supabase.com/dashboard/project/vwoizjesyyygmokfqpyy/settings/api).
2. Set **`ENCRYPTION_KEY`** (`openssl rand -hex 32`) for session cookies (required in production). The app reads `ENCRYPTION_KEY` in `src/lib/crypto.ts`.
3. Local dev: `APP_MODE=full` and `ENABLE_DEMO_AUTH=true` (defaults in `.env.example`). Production waitlist: `APP_MODE=waitlist`; enable `ENABLE_DEMO_AUTH=true` only on preview/staging for ops admin access.
4. For local booking without Stripe: keep `SKIP_STRIPE_PAYMENTS=true` (default in `.env.example`).
5. Optional: `E2E_STUB_LLM=true` for stubbed briefings; `OPENAI_API_KEY` / `GEMINI_API_KEY` for real APX-02.

Cloud Agent VMs often inject only `NEXT_PUBLIC_SUPABASE_URL`. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are required** for the landing page, demo auth, booking APIs, and Playwright E2E.

### Commands (see `README.md`)

| Task | Command |
|------|---------|
| Dev server | `npm run dev` → http://127.0.0.1:3000 |
| Unit tests | `npm test` (no external services) |
| Lint | `npm run lint` (repo may have pre-existing ESLint errors) |
| Production build | `npm run build` |
| E2E | `npm run test:e2e` — Playwright starts its own dev server; **free port 3000** first |

### Running services

- **Only required process:** Next.js dev server (`npm run dev`). Use tmux for long-running dev (e.g. session `next-dev-server`).
- **E2E:** Playwright `webServer` runs `npm run dev -- --hostname 127.0.0.1` with `APP_MODE=full`, `ENABLE_DEMO_AUTH=true`, `SKIP_STRIPE_PAYMENTS=true`, and `E2E_STUB_LLM=true`. Auth uses `POST /api/e2e/session`, not `/auth` presets.
- **Not in-repo:** Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) and Daily webhooks are optional for full payment/video flows.

### First-run tooling

After `npm ci`, install Playwright browsers once if running E2E: `npx playwright install chromium --with-deps`.

### Demo auth (local / E2E only)

With `ENABLE_DEMO_AUTH=true`, sign in at `/auth` with seed emails (`carlos@astrolink.ai`, `chris@astrolink.ai`, `admin@astrolink.ai`) or call `POST /api/e2e/session` with `{ "role": "mentee" | "mentor" | "admin" }`. Seed UUIDs must exist in Supabase (`20260531140100_seed_d1_dev.sql`).
