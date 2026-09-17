# Handoff: Expert Offers guest checkout

Copy into a new session on branch `feat/expert-offers`. Do not implement on `main` or the Facebook Pixel branch.

---

You are continuing AstroLink **Expert Offers**. Backend + Services/public/booking UI polish already exist on this branch. **This session implements the locked unsigned-buyer flow**, then stop for `/qa`. Do not `/ship` unless asked. Do not reopen SKU product decisions.

## Checkout

- Branch: `feat/expert-offers`
- App: `/Users/carloshernandez/Development/Code Projects/AstroLink`
- Dev server: **http://127.0.0.1:3001** (port 3000 is often rocketfuelcoffee)
- Prior UI-polish handoff: `docs/superpowers/handoffs/2026-09-16-expert-offers-ui.md`
- Context save: `~/.gstack/projects/CarlosPHernandez-AstroLink/checkpoints/20260917-124449-expert-offers-guest-checkout.md`

Read first: `DESIGN.md`, `docs/superpowers/specs/2026-09-15-expert-offers-design.md`.

## Locked unsigned-buyer flow (2026-09-17)

Service URL is the landing. Time and goals come before any account. Sign-in or create account happens at checkout, **before the card**.

1. **Landing** `/s/{mentorSlug}/{offerSlug}` — public. Face, title, frozen price/duration, description. CTA **Book this session**. No login.
2. **Details** `/booking?mentor=&offer=` — allowed **without a session** when `offer` is set. Datetime picker, goals, background. No slider. No other experts. Signed-in buyers see the same form.
3. **Continue**
   - Signed in as mentee → POST `/api/book` → existing Stripe step.
   - Signed out → stash form in `sessionStorage` (key by mentor+offer), go `/auth?mode=signup&redirect=/booking?mentor=&offer=`. Signup default, login tab stays. complete-profile must keep the redirect. Restore form, then POST `/api/book`, then card.
4. After pay: confirmation, join, briefing, mentee dashboard. Unchanged.

`/api/book` still requires `session.role === 'mentee'`. Do **not** take a PaymentIntent from a ghost user. Directory 1:1 and Chris wizard stay untouched.

## Already in the working tree (UI polish)

- Services: Publish (no path in the button), title-case chips, load-error + Try again (not empty state), rounder `md-offers` cards/chips
- Public page: landing tokens, Directory link, Book CTA
- Booking: offer back-link to `/s/...`; summary shows frozen duration + price not `$X/hr`
- Empty portrait URLs fall back in `toOptimizedImageUrl`

## Do not rebuild

Schema, `/api/book` lock-in, counters, Chris wizard, homepage/directory chips. Do not enable extra mentors. Do not put the allowlist email in app TS.

## How to verify

1. Incognito: open a published `/s/{slug}/{offer}` → Book this session → see time/goals **without** hitting `/auth` first.
2. Continue unsigned → signup/login → return with the same SKU, time, and goals still filled → pay.
3. Already-signed-in mentee: Book → details → pay, no auth bounce.
4. Draft URL still 404s. Generic `/booking` (no `offer`) still auth-first.
