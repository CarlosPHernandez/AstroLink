# Design: Chris goals-first booking funnel (conversion-hardened)

**Date:** 2026-07-20  
**Branch context:** `chris-booking-wed-duration`  
**CEO plan:** `~/.gstack/projects/CarlosPHernandez-AstroLink/ceo-plans/2026-07-20-chris-goals-first-funnel.md`  
**Status:** Approved for implementation planning  

## Problem

Auth-first on the Chris wizard taxes impulse before emotional commitment. Visitors hit account creation before stating why they want Chris, so drop-off happens before desire is captured. Duration-scaled pricing and Wed–Sun dates are landing on the branch, but the step order, draft survival, landing price honesty, and analytics still assume the old funnel.

## North star

**Paid conversions.** Capture intent while desire is high, ask for identity to lock the slot, then charge. Drafts survive short abandons without relying on incomplete-booking email (deferred).

## Approach

**Conversion-hardened funnel** (Approach 2 from brainstorm):

- Reorder wizard: **session → account (if signed out) → payment**
- Hybrid intent gate: **goals required**, **background optional**
- Draft in **`localStorage` with 48h soft TTL** + restore banner
- After auth with a complete draft: **straight to payment**; signed-in return with complete draft also opens on **payment**; signed-out return with complete draft opens on **account** (intent already captured)
- Landing: live price next to duration; hero copy not fixed “45-minute” only
- Analytics reindexed for goals-first; short measurement checklist

Not chosen: minimal reorder only (weak abandon recovery); full session-builder redesign (over scope).

## Explicit non-goals

- Incomplete mid-funnel email (CEO E5)
- Full session-builder redesign (CEO Approach C)
- Redesigning goals/background into a single field (fields stay; validation changes)
- Non-Chris booking wizard step-order change
- Stripe / book API contract changes beyond duration already on branch and Chris-scoped hybrid validation
- Marketing email copy and OG meta rewrites (product UI only for 45-minute de-hardcode)
- Admin BI dashboard

---

## §1 Funnel flow and step machine

### Surfaces

| Surface | URL | Role |
|---------|-----|------|
| Landing | `/talk-with-chris` | Date + duration + live price → Request Session |
| Wizard | `/booking?campaign=chris…` | Intent → identity (if needed) → payment |

### Step order

| Auth state | Order |
|------------|--------|
| Signed out | `session` → `account` → `payment` |
| Signed in | `session` → `payment` (account never shown) |

### Continue rules

1. **Session → next**  
   Client validates goals floor, `durationMinutes`, bookable `scheduledAt`. Background may be empty.  
   On pass: persist draft, then signed-out → `account`, signed-in → `payment` (existing book/checkout path).

2. **Account → next**  
   On successful register/login (`router.refresh()` restores session): hydrate draft.  
   If session fields still valid → **`payment` immediately** (no session re-show).  
   If draft missing/invalid → `session` (banner if partial data).

3. **Initial step on wizard mount (after hydrate)**  
   | State | Complete draft (goals + duration + date valid) | Incomplete / empty draft |
   |-------|-----------------------------------------------|---------------------------|
   | Signed in | `payment` | `session` |
   | Signed out | `account` (skip re-entry of goals) | `session` |

   Users can still reach `session` via progress control or payment **Edit** links. Banner shows on `session` when goals/background restored.

4. **Payment**  
   Summary: date, duration, price, goals preview.  
   **Edit goals** / **Edit length** → return to `session` (draft intact).  
   Successful pay / next-steps view → **clear draft**.

### Progress UI

- Signed out: 3 segments — Session · Account · Payment  
- Signed in: 2 segments — Session · Payment  

### Account step copy

Replace “Continue to Goals” framing with identity-after-commitment copy, e.g. **“Create account to lock this session”** / sign-in equivalent.

---

## §2 Draft storage and restore banner

### Storage

- **Key:** `astrolink:chris-booking-draft:v1`
- **Backend:** `localStorage` (not `sessionStorage`)
- **TTL:** 48 hours from `updatedAt`; expired reads delete the key
- **Clear:** next-steps / paid success; optional banner “Start over”; expired TTL

### Payload

```ts
type ChrisBookingDraft = {
  goals: string
  background: string // may be ""
  durationMinutes: number
  scheduledAt: string
  date: string | null // YYYY-MM-DD from landing when present
  marketingReferrer: string | null // restore context only; server owns price
  updatedAt: number // epoch ms
}
```

### Write triggers

- On successful session continue (required)
- On goals/background/duration changes (debounced or on blur preferred; continue-only is minimum viable)
- On landing Request Session: partial draft `{ durationMinutes, date, scheduledAt, marketingReferrer }` so duration/date survive bounce before goals

### Hydrate rules

- Wizard mount
- After auth success / `session` prop becomes non-null
- **URL prefills for date/duration win** when present on this navigation (fresh landing intent)
- **Goals/background:** prefer non-empty draft over empty state

### Restore banner (E4)

- Show when hydrate finds non-empty `goals` **or** non-empty `background`
- Copy: “Continue where you left off” (optional soft age line)
- Actions: dismiss for this mount; optional Start over (clear draft + reset fields)
- Banner does not block the form

### Module

- `src/lib/chris-campaign/chris-booking-draft.ts`: `loadDraft`, `saveDraft`, `clearDraft`, `isDraftExpired`
- Unit-tested; client-only; document privacy (goals text, 48h TTL, clear on pay)

---

## §3 Validation (hybrid gate) and payment edit path

### Constants

- `CHRIS_GOALS_MIN_CHARS = 50` (within the agreed 40–60 band)

### Session continue (client)

| Field | Rule |
|--------|------|
| goals | Required, trimmed, min 50 chars. Message: conversion-friendly (“Add a bit more so Chris can prepare.”) |
| background | Optional; empty allowed; label/helper marks Optional |
| durationMinutes | Existing Chris clamp/step rules |
| scheduledAt | Existing bookable date rules (Wed–Sun, etc.) |

Hard fail: stay on session with field errors; do not advance.

### Server (`BookBodySchema` / book API)

Chris campaign only (`campaign === chris`):

- `background` optional (empty OK)
- `goals` min `CHRIS_GOALS_MIN_CHARS` (50)

**Non-Chris bookings:** leave current mins (goals/background min 10) unchanged so scope stays campaign-scoped.

### Account step

No goals form on account. Post-auth resume re-validates draft; incomplete → session with errors.

### Payment step

- Goals preview ~120 chars + ellipsis
- Edit controls return to session without clearing draft
- `POST /api/book` sends full body including optional background
- Stripe / `SKIP_STRIPE_PAYMENTS` paths unchanged beyond existing duration work

### Session CTAs

- Signed out: “Continue” / “Continue to create account”
- Signed in: “Continue to payment”
- Keep both goals and background fields visible (hybrid = validation + framing, not layout removal)

---

## §4 Landing: duration, live price, copy

### Live price (E1)

- Price line/chip adjacent to `DurationStepper` on desktop request form and mobile booking surfaces
- `resolveChrisChargeCents(marketingReferrer, durationMinutes)` — same SOOT as server
- Early-access: charge + existing discount/strike framing if already used in wizard
- Public/social: full duration-scaled price
- Updates immediately on stepper change; accessible text (not color-only)

### DurationStepper polish

- Chris landing/wizard must not rely only on `.experts-profile` styles
- Scope visibility tokens under Chris campaign wrappers so stepper is readable on dark UI

### Landing → wizard

- Keep href params: `date`, `ref`, `durationMinutes`
- Partial draft save on Request Session (see §2)
- Wizard prefers URL date/duration over draft when params present

### Copy (E3) — product UI only

| Place | Change |
|--------|--------|
| Mobile + desktop hero H1 | e.g. “Private 1:1 session with Astronaut Chris Sembroski” — not fixed “45-Minute” |
| Body copy guaranteeing “45 minutes” | Generalize to booked length / full session time |
| Other Chris campaign product strings (“45-minute”) | Sweep UI components in campaign path |

**Out of scope:** marketing email templates, OG/social meta defaults.

### Landing non-goals

No goals fields, no Stripe, no scarcity logic changes beyond duration scaling already on branch.

---

## §5 Analytics, measurement, tests

### Analytics

Keep event **names** for historical continuity; change order defaults and reporter side effects.

| Event | Trigger under goals-first |
|--------|---------------------------|
| `chris_booking_page_view` | Wizard mount + `signed_in` (unchanged) |
| `chris_session_continue` | Passes session gate — **before** account when signed out |
| `chris_auth_success` | Register/login success — **after** session when signed out |
| `chris_checkout_*` / `chris_payment_error` | Unchanged |
| `chris_wizard_exit` | Default `last_step` = **`session`** (not `account`) |

**Exit outcomes** (same enum, new reading):

| Outcome | Meaning |
|---------|---------|
| `bounce` | Left without session continue (and not paid) |
| `session_only` | Session continue without checkout (may lack auth) |
| `auth_only` | Auth without session continue (edge) |
| `checkout_started` / `paid` | Unchanged |

Fix `reportAuthSuccess` so register no longer forces `lastStep → session`; after goals-first auth, next is payment (or session if draft incomplete).

Optional nicety (not required): draft-restored signal on page view.

### Measurement checklist (E6)

Document once (module comment on analytics **or** short how-to blurb — single place):

1. Pre-ship baseline: historical auth-before-session pattern vs post-ship session-before-auth.
2. Signed-out: rate of `chris_session_continue` occurring before `chris_auth_success`.
3. Paid rate: `chris_checkout_success` / `chris_booking_page_view` and / `chris_session_continue`.
4. Exit `last_step` distribution: session vs account vs payment vs stripe.
5. Draft: QA-only (banner + restore); no BI dashboard.
6. Segment by `ref` (early-access vs public) when volume allows.

**Thesis to validate:** more visitors write goals before identity; paid / session_continue does not collapse.

### Error handling

| Case | Behavior |
|------|----------|
| Session validation fail | Inline errors; stay on session |
| Auth fail | Existing alerts; **draft preserved** |
| Book / Stripe fail | Existing handling; draft **not** cleared until success |
| Corrupt / expired draft | Silent clear; no banner |

### Test plan

**Unit**

- Draft load/save/clear, 48h expiry, corrupt JSON
- Chris schema: goals min 50, empty background OK; non-Chris mins unchanged
- Analytics: default last step `session`; outcomes with session-before-auth progress
- Pricing display if helper extracted

**Wizard behavior**

- Signed-out initial step `session`; signed-in `session`
- Session continue signed-out → `account` + draft written
- Complete draft + authenticated session → step `payment`
- Banner when goals non-empty

**E2E (Chris campaign)**

- Signed-out: landing (duration + price) → goals → account → payment path (`SKIP_STRIPE` OK)
- Signed-in: session → payment (no account UI)
- Draft: goals set, reload, banner + fields restored
- Empty background continues; goals under 50 blocked

**Manual**

- DurationStepper readable on dark landing (mobile + desktop)
- Hero not “45-Minute” only
- Edit goals from payment preserves data

### Module map

```
src/lib/chris-campaign/chris-booking-draft.ts   # new
src/lib/book-request-schema.ts                  # Chris hybrid refine
src/components/chris-campaign/chris-booking-wizard.tsx
src/components/chris-campaign/chris-request-session-form.tsx
src/components/chris-campaign/chris-mobile-booking-card.tsx
src/components/chris-campaign/chris-landing*.tsx / *.css
src/lib/chris-campaign/chris-campaign-analytics.ts
src/lib/chris-campaign/use-chris-wizard-analytics.ts
docs or analytics comment                         # measurement checklist
```

No new API routes.

---

## Decisions log (brainstorm)

| Topic | Decision |
|--------|----------|
| Scope posture | Challenge-friendly vs CEO plan |
| Intent fields | Hybrid: goals required, background optional |
| Primary metric | Paid conversions |
| Draft persistence | `localStorage`, 48h soft TTL |
| Post-auth resume | Straight to payment if session complete |
| Goals floor | 50 characters (`CHRIS_GOALS_MIN_CHARS`) |
| Implementation shape | Conversion-hardened funnel (Approach 2) |

## Open implementation details (non-blocking)

- Exact debounce timing for draft autosave (blur vs 300ms)
- Whether “Start over” is required on banner v1 (recommended)
- Whether draft-restored analytics event ships in the same PR

These can be chosen during implementation without reopening product direction.
