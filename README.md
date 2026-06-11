# AstroLink

Paid aerospace expert network (live 1:1 sessions, Stripe, Daily, Gemini agents). Next.js App Router + Supabase.

**D1 engineering status:** [docs/d1-implementation-plan.md](docs/d1-implementation-plan.md)

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

## Documentation

Index: [docs/README.md](docs/README.md)

| Topic | Start here |
|-------|------------|
| First local video call | [docs/tutorial/first-video-session.md](docs/tutorial/first-video-session.md) |
| Investor demo runbook | [docs/how-to/video-session-demo.md](docs/how-to/video-session-demo.md) |
| Video APIs & gates | [docs/reference/video-session.md](docs/reference/video-session.md) |
| Why private rooms + webhooks | [docs/explanation/video-session-architecture.md](docs/explanation/video-session-architecture.md) |
| D1 status & checklist | [docs/d1-implementation-plan.md](docs/d1-implementation-plan.md) |

## Tests

```bash
npm test          # Vitest unit/contract tests
npm run test:e2e  # Playwright D1 golden path (requires .env.local + Supabase seed)
```

Vitest covers D1 contract logic: booking pricing, `/api/book` request schema, Daily webhook parsing, LLM rate limits (including caption scope), dev payment skip helpers, D3 translate-segment / segment-cache / translation-queue / caption-direction paths, transcript APIs, and public expert helpers (`expert-book-href`, `expert-bio`).

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

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
