# Handoff: Expert Offers UI polish

Copy everything below the line into a **new** Grok session on branch `feat/expert-offers`.

---

You are continuing AstroLink **Expert Offers** (beta SKU layer). Logic and backend already shipped on this branch. **This session is UI polish only**, then stop for `/qa`. Do not re-plan, do not re-implement booking, do not `/ship`.

## Checkout

- Branch: `feat/expert-offers` (pushed to `origin`, tip `d5e01b3`)
- Local app the founder tests: `/Users/carloshernandez/Development/Code Projects/AstroLink`
- Grok worktree (same commits): `/Users/carloshernandez/.grok/worktrees/code-projects-astrolink/featservices`
- Dev server: **http://127.0.0.1:3001** (port 3000 is often rocketfuelcoffee)
- Hosted Supabase project: `vwoizjesyyygmokfqpyy`
- Migrations **already applied** on hosted:
  - `supabase/migrations/20260915120000_expert_offers.sql`
  - `supabase/migrations/20260916120000_publish_expert_offer_atomic.sql`

Read first:

- `DESIGN.md` (calm light marketplace; mentor dashboard is **dark chrome** — `src/components/dashboard/mentor-dashboard.css`)
- `docs/superpowers/specs/2026-09-15-expert-offers-design.md`
- `docs/superpowers/plans/2026-09-15-expert-offers.md` (implementation already done; do not re-execute SDD)

## Product (locked — do not reopen)

- Expert Offers = named SKU on existing live 1:1 (`/api/book` → Stripe → Daily → email). Not a marketplace.
- Public URL: `/s/{mentorSlug}/{offerSlug}`
- Checkout: `/booking?mentor=&offer=` — hide slider, lock price/duration, keep datetime picker + goals + background
- Dashboard tab label **Services** (`id: 'offers'`), flag-on only, after Sessions / before Videos
- Duration **15 | 30 | 45 | 60**. Price **$10–$500**. Max **5** published.
- Draft/unpublished/archived public URLs **404**. That is correct.
- No weekly hours, no Google Calendar, no prep files, no homepage/directory chips
- Chris campaign wizard stays untouched; if both `offer` and `campaign=chris`, **offer wins**
- Flag `mentors.expert_offers_enabled` default false. SQL allowlist only: `cpachecohernande631@access.alamancecc.edu` (do **not** put that email in app TS)
- Comp grants rejected on offer bookings

## Already working (founder dogfooded)

- Create draft → shows in Services tab
- Publish blocked with a visible alert when Stripe/listing incomplete
- After listing/Stripe, **publish succeeds** and the service lists
- Atomic 5-published cap: RPC `publish_expert_offer` (advisory lock). Dummy call returns `{"ok":false,"error":"not_found"}` — function is live
- Soft publish alert (not emergency red): `.md-alert` / `.md-alert-error` in mentor-dashboard.css — 16px radius, surface-soft, warm hairline, white title + muted body. Title: **Can't publish this session**

## This session’s job

Visual polish on:

1. Mentor **Services** tab (`src/app/dashboard/mentor/mentor-offers-panel.tsx` + `mentor-dashboard.css`)
   - List, create/edit form, publish/unpublish/archive, copy URL, error alert
   - Rounder/calmer components if they still feel sharp; stay on `md-*` tokens
   - Publish button currently concatenates the path (`Publish /s/...`) — ugly; fix copy
   - Status chips print raw enums (`published`) — title-case
   - GET failure used to look like empty list; load errors should stay the alert, not `md-empty`
2. Public page `/s/[mentorSlug]/[offerSlug]` (`src/app/s/...`)
   - One screen, DESIGN.md light marketplace, no slider, no other experts
   - CTA **Book this session** → `/booking?mentor=&offer=`
3. Booking SKU lock-in (`src/app/booking/page.tsx`, `booking-client.tsx`)
   - Summary shows offer title + frozen price, not `$X/hr`
   - Back-link still goes to `/experts` — consider `/s/...` when `offer` is set

Do **not** restyle the whole mentor dashboard. Do **not** add homepage/directory chips.

## Do not rebuild

- Schema, `/api/book` lock-in, briefing, counters, E2E helpers, Chris wizard
- Do not enable Eiman/Chris/David
- Do not use the allowlist email as an E2E fixture (`e2e/expert-offers.spec.ts` uses `chris@astrolink.ai` and restores flags)

## Known leftovers (code review) — only touch if they block UI

- P1 cap: **fixed** (`publish_expert_offer`)
- P2: counters are still read-modify-write (`src/lib/expert-offers/counters.ts`)
- P2: admin export/PDF still say “Packaged session” not snapshot title
- P2: recap prompt can echo enum `packaged_offer`
- P2: slug create TOCTOU can 500 on unique violation
- VERSION still `0.18.0.0` — `/ship` bumps this, not this session
- E2E skips if `expert_offers` table missing (CI can go green without migration)

## How to verify

1. `cd "/Users/carloshernandez/Development/Code Projects/AstroLink" && git checkout feat/expert-offers && git pull`
2. App at http://127.0.0.1:3001 (start `npm run dev -- --hostname 127.0.0.1 --port 3001` if down)
3. Sign in as the flag-on mentor (allowlist email, or demo-activation if they flipped listing/Stripe)
4. Services tab: create, fail-publish (if unlisted) sees calm alert, succeed-publish, copy URL
5. Incognito: `/s/{slug}/{offer}` then Book this session — locked price/duration
6. Draft URL still 404s until published

When UI feels done, **stop** and tell the founder to run `/qa` in a follow-up, then `/ship`. Do not open a PR in this session unless they explicitly ask.
