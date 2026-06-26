# AstroLink

AstroLink is a paid expert network for aerospace and space — live 1:1 video sessions with verified operators, astronauts, and industry specialists (GLG/Minnect-style, vertical-specific).

Buyers book sessions, receive AI-generated pre-call briefs, join private Daily rooms, and get post-session recaps. Experts set rates; the platform handles payments, compliance hooks, and bilingual session access.

**Stack:** Next.js 16 (App Router) · Supabase · Stripe · Daily · Gemini (`@google/genai`)

**Engineering status:** [docs/d1-implementation-plan.md](docs/d1-implementation-plan.md)

## Gemini XPRIZE

AstroLink is an entrant in [Build with Gemini XPRIZE](https://xprize.devpost.com/) ($2M prize pool, deadline Aug 17, 2026).

| | |
|--|--|
| **Category** | [**Professional Services Access**](https://xprize.devpost.com/) — connecting everyday people with the expert guidance they need |
| **Problem** | High-stakes aerospace knowledge is locked behind personal networks, opaque consulting firms, and conferences most buyers cannot access |
| **Product** | A marketplace where anyone can discover, book, and follow a live session with a verified expert — with AI running match, brief, synthesis, translation, and compliance triage |

### Why this category

AstroLink is not a generic video app or course platform. It sells **access to named experts** — flight controllers, program managers, astronauts — with escrow, audit trails, and session context built for regulated-adjacent domains.

### AI-native operations (production agents)

Gemini (and OpenAI fallback via `src/lib/llm.ts`) runs key decisions in the live product:

| Agent | Role |
|-------|------|
| **APX-01** Booking | Expert matching from buyer goals + roster |
| **APX-02** Briefing | Dual pre-session briefs for mentee + expert (`briefing_json` v2 bundle) |
| **APX-03** Session | Post-call summary and action items from transcript |
| **APX-06** Translation | Live captions and localized recap (aerospace glossary) |
| **APX-08** Notifications | Booking confirmation email + calendar invite (Resend) |
| **APX-04** Compliance | Intake and transcript flags for ops review (ITAR-adjacent keywords) |

Structured decision logs for judges: [T8 in D1 plan](docs/d1-implementation-plan.md) (export from `audit_log`).

### Competition links

- [Devpost — rules, categories, submission checklist](https://xprize.devpost.com/)
- [geminixprize.com](https://www.geminixprize.com/)

## Supabase setup

1. Copy env template and fill keys from the [Supabase dashboard](https://supabase.com/dashboard/project/vwoizjesyyygmokfqpyy/settings/api) (publishable/anon + **service role** for server agents):

   ```bash
   cp .env.example .env.local
   ```

2. Migrations live in `supabase/migrations/` and are applied to project `vwoizjesyyygmokfqpyy`:
   - `20260531140000_initial_schema.sql` — core tables + RLS (public mentor directory)
   - `20260531140100_seed_d1_dev.sql` — dev seed (Chris Sembroski, `carlos@astrolink.ai` user)

3. Regenerate DB types after schema changes (requires [Supabase CLI](https://supabase.com/docs/guides/cli)):

   ```bash
   supabase link --project-ref vwoizjesyyygmokfqpyy
   supabase gen types typescript --linked -o src/lib/database.types.ts
   ```

4. **Demo auth** (until Supabase Auth): with `ENABLE_DEMO_AUTH=true`, use seed emails in `src/lib/auth-presets.ts` — mentee `carlos@astrolink.ai`, mentor Chris `chris@astrolink.ai`, or demo mentor Carlos `carlosphernandez2020@gmail.com` (dual-device video: see `docs/how-to/demo-dual-device-video.md`).

## D1 local booking flow

1. Set in `.env.local`: Supabase keys, `OPENAI_API_KEY` (or `GEMINI_API_KEY`), `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `DAILY_API_KEY`, and `SKIP_STRIPE_PAYMENTS=true` for local booking without Stripe.
2. Run `npm run dev`, sign in as **Carlos** (`carlos@astrolink.ai` on `/auth` with demo auth enabled).
3. Landing shows a six-card expert teaser; open the full roster at [`/experts`](http://localhost:3000/experts) (category filters, card grid, inline preview — desktop modal or mobile sheet). Click a name for the profile page (`/experts/[slug]`) or use **Book session** on a card for the fast path.
4. Profile or card → **Book** → `/booking?mentor=chris-sembroski` → pay with Stripe test card `4242…`.
4. After authorize, either:
   - Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, or
   - Dev fulfill: `POST /api/book/fulfill` with `{ "bookingId": "<uuid>" }` (development only).
5. Mentee dashboard shows APX-02 briefing; **Join session** opens `/session/[bookingId]` with a server-minted Daily token (private room).

## Repository layout

| Path | Purpose |
|------|---------|
| `src/app/` | Routes and API (`/early-access`, `/join`, `/experts`, `/booking`, …) |
| `src/components/` | Feature UI (`early-access`, `experts`, `booking`, `session`) |
| `src/lib/waitlist/` | Waitlist signup, routing, metrics, analytics |
| `src/lib/transcript-translation/` | Live captions and post-call translation |
| `docs/` | Tutorials, how-tos, reference ([index](docs/README.md)) |

## Documentation

Index: [docs/README.md](docs/README.md)

| Topic | Start here |
|-------|------------|
| First local video call | [docs/tutorial/first-video-session.md](docs/tutorial/first-video-session.md) |
| Bidirectional live captions | [docs/tutorial/bidirectional-live-captions.md](docs/tutorial/bidirectional-live-captions.md) |
| Investor demo runbook | [docs/how-to/video-session-demo.md](docs/how-to/video-session-demo.md) |
| Video APIs & gates | [docs/reference/video-session.md](docs/reference/video-session.md) |
| Why private rooms + webhooks | [docs/explanation/video-session-architecture.md](docs/explanation/video-session-architecture.md) |
| D1 status & checklist | [docs/d1-implementation-plan.md](docs/d1-implementation-plan.md) |

## Tests

```bash
npm test          # Vitest unit/contract tests
npm run test:e2e  # Playwright D1 golden path (requires .env.local + Supabase seed)
```

Vitest covers D1 contract logic: booking pricing, `/api/book` request schema, Daily webhook parsing, LLM rate limits (including caption scope), dev payment skip helpers, session waitlist guard (`getSession`), Stripe booking test-mode production guard, booking-agent mentor pool validation, D3 translate-segment / segment-cache / translation-queue / caption-direction paths, transcript APIs, and public expert helpers (`expert-book-href`, `expert-bio`).

### E2E (Playwright)

Automates the skip-Stripe D1 golden path, D3 localized recap, D3 live-caption stub, and public experts directory: E2E session bootstrap → book Chris → APX-02 briefing → session room; pt-BR mentee recap after `simulate_meeting_ended`; mentee caption rail with stubbed segment translation; `/experts` filters, preview panel, and profile deep links.

**Prerequisites:** `.env.local` with Supabase keys, `ENCRYPTION_KEY`, and seed data applied (`20260531140100_seed_d1_dev.sql`, plus `20260607120000_session_translations.sql` for D3 Phase 2). Playwright sets `APP_MODE=full`, `ENABLE_DEMO_AUTH=true`, `SKIP_STRIPE_PAYMENTS=true`, `E2E_STUB_LLM=true`, and `DAILY_TRANSCRIPTION_ENABLED=false` on the dev server automatically (so post-session synthesis runs without Daily transcription).

Playwright starts its own Next.js dev server on `127.0.0.1:3000` — stop any other process on that port before running E2E.

```bash
npm run test:e2e      # headless
npm run test:e2e:ui   # interactive UI mode
```

E2E bookings are tagged with spec-specific goals prefixes (`E2E:golden-path`, `E2E:localized-recap`, `E2E:live-captions`, `E2E:experts-directory`, etc.) and cleaned up before/after each spec. See [docs/d3-transcript-translation-roadmap.md](docs/d3-transcript-translation-roadmap.md) for D3 phases. Real Stripe checkout E2E is deferred to the real-Stripe feature branch.

## Getting Started

```bash
cp .env.example .env.local   # fill Supabase, Stripe, Daily, GEMINI_API_KEY / OPENAI_API_KEY
npm ci
npm run dev                  # http://localhost:3000
```

**Waitlist production:** `APP_MODE=waitlist` — public surface is `/early-access` and `/join/[slug]` only. See [AGENTS.md](AGENTS.md).

**Deploy:** Vercel (production URL: [astro-link.space](https://astro-link.space)). See [docs/how-to/stripe-production-cutover.md](docs/how-to/stripe-production-cutover.md) for payment cutover.
