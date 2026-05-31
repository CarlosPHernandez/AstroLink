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

4. **Mock auth IDs** (until Supabase Auth): preset logins in `src/app/auth/actions.ts` should use seed UUIDs — mentee `a0000001-0000-4000-8000-000000000001`, mentor Chris `a0000002-0000-4000-8000-000000000002`.

## D1 local booking flow

1. Set in `.env.local`: Supabase keys, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `DAILY_API_KEY`, and `STRIPE_BOOKING_TEST_MODE=true` (Chris has no Stripe Connect account in seed yet).
2. Run `npm run dev`, sign in as **Carlos** (`carlos@astrolink.ai` preset on `/auth`).
3. Landing loads Chris from DB → **Book** → `/booking?mentor=chris-sembroski` → pay with Stripe test card `4242…`.
4. After authorize, either:
   - Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, or
   - Dev fulfill: `POST /api/book/fulfill` with `{ "bookingId": "<uuid>" }` (development only).
5. Mentee dashboard shows APX-02 briefing; **Join session** uses the Daily room URL.

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
