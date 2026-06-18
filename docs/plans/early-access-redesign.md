# Early Access Waitlist — Design Spec (Phase 0)

**Status:** Phase 0–4 complete  
**Date:** 2026-06-16  
**Direction:** Focused conversion (Intro.co / Ditto-style) + roster teaser (2–4 DB experts)  
**Page:** `/early-access` (production waitlist surface when `APP_MODE=waitlist`)

---

## Executive summary

The current waitlist page works functionally (form, API, success state) but scores **~5/10** on conversion focus. It reads like a shortened marketing landing page—not a single-purpose signup surface.

**10x target:** One viewport = one promise + one action. Proof (expert faces) sits below the fold as a light trust strip, not a second hero.

**Overall plan score after Phase 0 fixes:** **9/10** (remaining 1 point: live visual QA after build)

---

## Reference comps (moodboard)

| Product | What to steal | What to avoid |
|---------|---------------|---------------|
| [Intro.co](https://intro.co) | Single CTA, minimal chrome, expert-as-proof | Phone-first flow (out of scope) |
| [Linear waitlist](https://linear.app) | Tight headline, one field, calm whitespace | Generic SaaS purple gradients |
| AstroLink `/` landing | M3 tokens, mono ops accents, `floating-card-shadow` | Full hero demo, comparison table, directory grid |

**Litmus checks (target post-build):**

| Check | Current | Target |
|-------|---------|--------|
| Brand unmistakable in first screen? | Partial | YES — AstroLink + aerospace voice |
| One strong visual anchor? | Chris portrait (competes with CTA) | Signup card OR roster row, not both above fold |
| Scannable by headlines only? | NO (too many sections) | YES — 2 headlines max above fold |
| Each section one job? | NO (3 feature cards) | YES |
| Cards necessary? | Overused | Form card only above fold |
| Motion improves hierarchy? | reveal-up only | YES — form focus + success fade |
| Premium without decorative shadows? | Borderline | YES — rely on type + spacing |

---

## Locked creative decisions

### D1 — Information architecture

**APPROVED layout order:**

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: AstroLink logo (left) · optional "Experts" link     │
├─────────────────────────────────────────────────────────────┤
│ HERO (above fold)                                           │
│  Mobile:  [Headline → Subcopy → Signup card → Trust line]   │
│  Desktop: [Headline + Subcopy]  |  [Signup card sticky]     │
├─────────────────────────────────────────────────────────────┤
│ ROSTER TEASER (below fold)                                  │
│  "Verified experts on AstroLink" + 4 compact tiles          │
├─────────────────────────────────────────────────────────────┤
│ FOOTER: © year · Privacy (mailto or /privacy when exists)   │
└─────────────────────────────────────────────────────────────┘
```

**Removed from current page:**

- Full-height Chris portrait hero column
- 3-column feature card grid (AI-slop pattern #2)
- "Featured expert" long-form article block
- Duplicate "Join the waitlist" CTAs (hero anchor + form)

**ASCII mobile wireframe (375px):**

```
┌──────────────────────┐
│ AstroLink            │
├──────────────────────┤
│ EYEBROW (mono)       │
│ Headline (2 lines)   │
│ Subcopy (2 lines)    │
│ ┌──────────────────┐ │
│ │ Email            │ │
│ │ [____________]   │ │
│ │ [ Request access]│ │
│ │ privacy line     │ │
│ └──────────────────┘ │
│ roster: 4 avatars    │
│ © 2026               │
└──────────────────────┘
```

### D2 — Copy (locked)

| Element | Copy |
|---------|------|
| Eyebrow | `VERIFIED AEROSPACE NETWORK` (mono, `text-[10px] font-mono uppercase tracking-wider`) |
| Headline | **Talk to astronauts and operators—before everyone else.** |
| Subcopy | Live 1:1 video sessions with vetted aerospace experts. Request early access; we'll email you when booking opens. |
| Form title | *(none — headline is enough; no second H2 in card)* |
| Email label | Visible `Email` label above field (not placeholder-only) |
| Placeholder | `you@company.com` |
| CTA button | `Request access` (idle) · `Requesting…` + spinner (loading) |
| Trust line | `No spam. Unsubscribe anytime.` |
| Roster heading | `On the roster` |
| Roster sub | `Astronauts, flight controllers, and engineers—verified, not crowdsourced.` |

**Success copy:**

| Case | Headline | Body |
|------|----------|------|
| New signup | You're on the list | We'll reach out when early access opens. |
| Duplicate email | You're already on the list | We have your email—no need to sign up again. |
| Rate limit | Slow down | Too many attempts. Try again in a moment. |
| Network error | Connection issue | Check your network and try again. |

### D3 — Mobile signup placement

**APPROVED: In-flow signup card** directly under subcopy (NOT sticky bottom bar).

Rationale: Sticky bars feel aggressive on a premium aerospace brand; Intro.co keeps the form in the hero flow. Signup must be visible on iPhone 14 without scrolling (~640px total hero height budget).

### D4 — Success state

**APPROVED: Inline card takeover** (same `#signup` container, form swaps to success panel).

- Do NOT use modal (blocks roster proof)
- Do NOT navigate away
- Add `aria-live="polite"` on success region
- `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on success
- Differentiate `alreadyRegistered` from API response
- Optional tertiary action: `Add another email` (keep, de-emphasized as text link)

### D5 — Roster teaser density

**APPROVED: Compact tile** — circular avatar (56px) + name + role (one line each). No rates, no book CTA, no hover expansion.

- Source: `listPublicMentors()` server-side, `experts.slice(0, 4)`
- Layout: horizontal scroll on mobile, 4-column grid on `sm+`
- Empty fallback: hide section if zero experts (do not show hardcoded Chris)
- Chris may appear naturally if in DB

**New component:** `src/components/early-access/roster-teaser.tsx`  
**Do not reuse** interactive `ExpertCard` (booking/select semantics wrong for waitlist)

### D6 — Header

**APPROVED:** Match landing minimalism

- Left: `AstroLink` wordmark → `/`
- Right: `Experts` text link → `/experts` (only when `APP_MODE=full`; hidden in waitlist-only prod)
- Remove standalone "Early access" pill (page context is obvious)

### D7 — Visual / brand

- **Classifier:** MARKETING/LANDING (hero) + functional form card
- **Background:** Single soft gradient orb top-right (keep, reduce size vs current)
- **Typography:** `font-display` for headline at `text-[32px] sm:text-[40px] lg:text-[48px]` — smaller than main landing, larger than current waitlist
- **Form card:** `rounded-xl floating-card-shadow border border-outline-variant` — the only card above fold
- **Motion:** `animate-reveal-up` on headline (stagger 100ms); success `animate-fade-in`
- **AI slop fixes:** Delete 3-feature grid; no icon-in-circle decoration row

---

## Interaction state table

| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
| Email signup | Button disabled, spinner, "Requesting…" | N/A | `FormAlert` or `FieldError` | Green success panel with headline + body | N/A |
| Roster teaser | Skeleton 4 circles (server) | Hide section | Hide section | N/A | Show fewer if `<4` experts |
| Page | SSR experts fetch | Same | Same | N/A | N/A |

---

## User journey (emotional arc)

| Step | User does | Should feel | Design support |
|------|-----------|-------------|----------------|
| 1 | Lands from ad/`?ref=` link | Curious, skeptical | Strong headline + verified roster below |
| 2 | Scans page | "This is real" | Expert faces from DB, mono eyebrow |
| 3 | Enters email | Low friction | One field, visible label, clear CTA |
| 4 | Submits | Brief anticipation | Spinner, button disabled |
| 5 | Sees success | Relief, confidence | Headline + check icon, differentiated duplicate copy |
| 6 | Leaves | Remembered brand | No clutter, professional tone |

**Time horizons:**

- **5 sec:** Headline + email field visible
- **5 min:** Understand experts are verified (roster teaser)
- **5 yr:** AstroLink = credible aerospace access (copy tone, not hype)

---

## Responsive & accessibility

| Viewport | Layout |
|----------|--------|
| `<640px` | Single column; signup before roster; roster horizontal scroll |
| `640–1024px` | Single column widened; roster 2×2 grid |
| `≥1024px` | 2-col hero: copy left 55%, sticky signup card right 45% |

**A11y requirements:**

- Visible email label (not placeholder-only)
- `aria-live="polite"` on success
- Submit button `min-h-[44px]`
- Focus ring on input + button (`focus-visible:ring-2`)
- Roster images: meaningful `alt="{name}, {role}"`
- Landmarks: `<header>`, `<main>`, `<footer>`

---

## What already exists (reuse)

| Asset | Path |
|-------|------|
| M3 tokens | `src/app/globals.css` |
| Form primitives | `FieldError`, `FormAlert` |
| API + schema | `src/app/api/early-access/route.ts`, `early-access-schema.ts` |
| Rate limit + referrer | `early-access-rate-limit.ts`, `early-access-referrer.ts` |
| Expert data | `listPublicMentors()` in `mentor-directory.ts` |
| Landing header pattern | `src/app/landing-page.tsx` |

**Gap:** No `DESIGN.md` — defer full `/design-consultation` until post-waitlist ship; infer tokens from globals + landing for this pass.

---

## NOT in scope (deferred)

| Item | Rationale |
|------|-----------|
| Phone capture on waitlist | Requires Twilio; separate auth project |
| Live public signup counter | Admin metrics exist; new API surface |
| Sticky mobile bottom CTA | Approved against in D3 |
| Full expert directory on waitlist | Belongs on `/experts` |
| Double opt-in email | Current insert-only flow is intentional |
| `DESIGN.md` creation | Follow-up after waitlist ships |

---

## Implementation phases (unchanged order)

1. **Phase 1** — Form quick wins (success headline, `alreadyRegistered`, spinner, `aria-live`, scroll)
2. **Phase 2** — Layout restructure per wireframe above
3. **Phase 3** — Server fetch + `roster-teaser.tsx`
4. **Phase 4** — `e2e/early-access.spec.ts` + `/design-review` screenshots

---

## Phase 0 scorecard (7 passes)

| Pass | Before | After spec | Notes |
|------|--------|------------|-------|
| 1 Information Architecture | 4/10 | **9/10** | Wireframe + removal list locked |
| 2 Interaction States | 7/10 | **10/10** | Full state table |
| 3 Emotional Arc | 5/10 | **9/10** | Journey storyboard added |
| 4 AI Slop Risk | 4/10 | **9/10** | Feature grid removed from plan |
| 5 Design System | 6/10 | **8/10** | Reuses globals; no DESIGN.md |
| 6 Responsive & A11y | 6/10 | **9/10** | Per-viewport spec |
| 7 Unresolved Decisions | 3/10 | **10/10** | D1–D7 locked |

**Overall: 9/10** — ready for Phase 1 implementation.

---

## Files to create/modify (implementation checklist)

- [x] Phase 1 — success headline, `alreadyRegistered`, spinner, `aria-live`, scroll (`early-access-success.ts`)
- [x] Phase 2 — focused layout, component split, locked copy, sticky signup on desktop
- [x] `src/components/early-access/waitlist-hero.tsx`
- [x] `src/components/early-access/waitlist-signup-form.tsx`
- [x] `src/components/early-access/waitlist-header.tsx`
- [x] `src/app/early-access/early-access-client.tsx` — thin shell
- [x] `src/app/early-access/page.tsx` — `showExpertsLink` from `isWaitlistMode()`
- [x] `src/components/early-access/roster-teaser.tsx` (Phase 3)
- [x] `src/app/early-access/page.tsx` — `listPublicMentors()` fetch + `revalidate = 300` (Phase 3)
- [x] `e2e/early-access.spec.ts` (Phase 4)