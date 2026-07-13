# Landing Motion & Narrative Redesign — Design Consultation

**Status:** Consultation complete — ready for phased implementation  
**Date:** 2026-07-12  
**Branch:** `page-redesign`  
**North star:** *Real humans who have done the work — not another autocomplete answer.*

---

## Executive summary

AstroLink’s landing redesign is directionally correct: editorial layout, learning-goal prompt, gated roster, and a human-vs-generic story beat. The gap is **motion sophistication** and **narrative clarity** — the hero still *reads* like an AI chatbot demo even though the copy says “verified expert.” Premium sites (Linear, Intro.co, Framer) tie every animation to a product story; motion is choreographed, not decorative.

**Overall score today:** **6.5 / 10** — good bones, needs a unified motion system and stronger “human expert” signaling.

**Target after Phase 3:** **9 / 10** — Phia/Intro-level polish with aerospace credibility.

---

## Landscape research (what clean pro sites actually do)

Sources: [SaaSFrame 2026 trends](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples), [Linear](https://linear.app/), [Intro.co](https://intro.co/), [MDN scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timelines), [Josh Comeau scroll-driven guide](https://www.joshwcomeau.com/animation/scroll-driven-animations/).

| Pattern | Who uses it | What it does | AstroLink fit |
|---------|-------------|--------------|---------------|
| **Story-driven hero** | Linear, Framer, Notion | Hero *shows* the workflow before scroll | Learning-goal card → expert match (not looping fake chat) |
| **Purposeful micro-motion** | Peec, Figma | Hover/scroll motion *explains* a feature | Submit orchestration: question → match → human reply |
| **Real UI / real faces** | Intro.co, Coherence | Screenshots & portraits, not abstract blobs | Expert portrait + verified badge in goal card after submit |
| **Split comparison** | Decipad, many B2B | Before/after or problem/solution scroll | `landing-story`: generic internet vs AstroLink expert |
| **Scroll-scrubbed sections** | Linear, Apple marketing | Progress tied to scroll position, often pinned | Replace blur-parallax with opacity/translate scrub |
| **CSS scroll-driven animations** | Modern premium builds | `animation-timeline: view()` — less JS, smoother | Progressive enhancement for story + benefits |
| **Personalized CTA** | Figma, UserJot | Input adapts what user sees next | ✅ Started — extend into expert match preview |
| **Minimal conversion chrome** | Intro.co waitlist flows | One promise, proof below fold | Reduce duplicate CTAs; let goal card carry conversion |

### What Intro.co does *not* do (important)

Intro leads with **expert cards** — face, verified check, rate, category. There is no faux “AI assistant” chat loop. AstroLink should borrow Intro’s proof-first pattern inside the goal module, not ChatGPT UI patterns.

### What Linear does well

Linear pins product UI while copy scrolls; motion always maps to **a specific product capability**. Decorative float loops are absent. Every section has a figure label (“FIG 0.2”) — editorial rhythm AstroLink already echoes with mono eyebrows.

---

## Designer review — dimension scorecard

| Dimension | Score | What would make it a 10 |
|-----------|-------|-------------------------|
| **Brand & voice** | 7/10 | Mono ops accents + “actually done the work” is strong. Needs consistent “human expert” language; drop “AI chat preview” aria labels. |
| **Visual hierarchy** | 6/10 | Hero competes with portrait + phone + two CTAs. After submit, goal card focus helps — extend that hierarchy through the page. |
| **Typography** | 7/10 | Montserrat landing display works. Benefits headlines could use more contrast between primary/secondary lines. |
| **Color & surface** | 7/10 | Mission palette is calm and pro. Expert card (ink) vs generic card (surface) contrast in story section is the right metaphor — push further. |
| **Motion & interaction** | 5/10 | Three systems overlap (keyframes, scroll-progress blur, IO reveal). Demo chat loop undermines submit state. Blur-on-scroll feels heavy vs Linear’s crisp scrub. |
| **Human vs AI narrative** | 6/10 | Story section copy is right; hero phone still looks like LLM chat. Missing: expert avatar, credentials, “live video” modality after submit. |
| **Conversion architecture** | 6/10 | Too many “Unlock / Create account” CTAs (hero ×2, benefits, directory). Goal-submit path is better — make it the primary funnel. |
| **Mobile** | 7/10 | Stacked hero works; story section loses scroll choreography on mobile — needs a simplified scrub or swipe comparison. |
| **Accessibility** | 8/10 | `prefers-reduced-motion` respected. Keep IO thresholds generous; avoid motion-only information. |
| **Performance** | 6/10 | Scroll listeners + blur filters on large sections = jank risk. Prefer transform/opacity; CSS scroll-driven where supported. |

---

## Core creative decision: “Expert relay,” not “AI chat”

**Problem:** The learning-goal phone module uses chat bubbles, “Private network” header, and assistant tone — visual language borrowed from ChatGPT. Visitors subconsciously bucket AstroLink with AI tools.

**Decision:** Rebrand the module as an **Expert relay** — the user’s question is routed to a verified human network.

### Visual language shift

| Today | Target |
|-------|--------|
| `aria-label="AI chat preview"` | `Learning goal → Expert network` |
| Generic assistant bubbles | User bubble + **expert-attributed** reply (avatar, name, verified) |
| Looping demo transcript | Demo only before interaction; after submit, **frozen personalized thread** |
| “Create free account” interrupt | Soft match preview; account CTA inside card footer after reply completes |
| Floating phone animation | Float only in idle demo; **still + elevated** when active (already started) |

### Copy frame (human leverage)

- **Generic (antagonist):** “Compiled from forums. Not accountable. Not your path.”
- **AstroLink (protagonist):** “Ask someone who has flown, built, or operated the system.”
- **After submit:** “Matched to verified experts in [category]” — even if matching is heuristic at first (propulsion / career / policy from keywords).

---

## Unified motion system (proposed)

### Principles

1. **One choreographer per section** — no competing loops in the same viewport.
2. **Motion explains the wedge** — every animation answers: “Why is this different from ChatGPT?”
3. **Opacity + translate only** on scroll — drop blur from scroll-linked effects (keep blur for gated roster teaser only).
4. **Progressive enhancement** — CSS `animation-timeline: view()` with IO/JS fallback.
5. **Reduced motion = full static story** — no information loss.

### Motion tiers

```
Tier 0 — Static (prefers-reduced-motion)
Tier 1 — Entrance (IntersectionObserver, once, stagger 80–120ms)
Tier 2 — Scroll-scrub (section progress 0→1, pinned optional)
Tier 3 — State machine (hero submit only — user interaction)
```

### Easing & duration tokens (lock)

| Token | Value | Use |
|-------|-------|-----|
| `--landing-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrances, focus transitions |
| `--landing-duration-fast` | `300ms` | Bubble appear, focus ring |
| `--landing-duration-medium` | `700ms` | Portrait dim, card elevation |
| `--landing-duration-slow` | `1100ms` | Scroll-scrub spans |
| `--landing-stagger` | `90ms` | List/card reveals |

### Hero submit orchestration (Tier 3)

Sequence after send (total ~4s before any account CTA):

```
0ms     User bubble slides in (already have)
300ms   Portrait dims (have)
600ms   Card header updates: expert avatar fades in + “Verified expert network”
1200ms  Reply types word-by-word (human pace, not instant block)
3200ms  Subtle footer link: “See who’s available →” (not a full-width button)
```

No modal. No second panel above the fold. **The card is the stage.**

### Story section — scroll-scrub comparison (Tier 2)

Desktop (pinned ~100vh runway):

- **0–40% scroll:** Generic internet card prominent left; portrait neutral center.
- **40–70%:** Crossfade — generic card opacity down, expert card opacity up.
- **70–100%:** Expert card locks; copy right: “Private expert access.”

Mobile: horizontal **swipe or drag slider** (before | after) — avoids 115vh dead zone.

### Benefits section — simplify

Current blur + 110px translate is cinematic but expensive. Replace with:

- Staggered IO reveal per column (already partially there)
- Optional: count-up or line-draw underline on scroll — subtle, not blur

---

## CTA architecture (de-clutter)

| Location | Today | Proposed |
|----------|-------|----------|
| Hero below fold | 2 buttons | 1 primary + 1 text link |
| Hero after submit | (removed panel ✅) | Card footer link only |
| Benefits | “Unlock access” button | Text link → `/auth` |
| Directory | Full button | Keep — end-of-page conversion |

**Rule:** Max **one** filled accent button visible per viewport.

---

## Implementation phases

### PR1 — Narrative & labels (small, high impact)

- [ ] Rename phone module labels; remove “AI” from a11y text
- [ ] After submit: show featured expert avatar + name in card header
- [ ] Heuristic category chip from goal keywords (“Propulsion”, “Career”, etc.)
- [ ] Soften assistant reply copy; third bubble becomes expert-attributed

**Files:** `landing-hero.tsx`, `landing-featured-expert.ts`, `globals.css`

### PR2 — Motion unification (medium)

- [x] Extract motion tokens to `.landing-mission` CSS vars
- [x] Remove blur from `.landing-scroll-*` and `.landing-benefit-item`
- [x] Stop demo loop when `submittedGoal` set (done); add word-by-word reply
- [x] Hero: reduce duplicate CTAs to 1+1

**Files:** `globals.css`, `landing-hero.tsx`, `landing-scroll-reveal.tsx`

### PR3 — Story scroll-scrub (larger)

- [x] Desktop: pinned story section with progress crossfade
- [x] Mobile: before/after slider component
- [x] Pinned scroll progress (`computePinnedScrollProgress`) — JS fallback; CSS `animation-timeline: view()` deferred

**Files:** `landing-story.tsx`, `globals.css`, new `landing-comparison-slider.tsx`

### PR4 — Polish & QA

- [ ] Playwright: goal submit → expert header → no unlock panel
- [ ] `prefers-reduced-motion` screenshot pass
- [ ] `/design-review` before/after on 375px + 1280px

---

## Reference moodboard (steal / avoid)

| Reference | Steal | Avoid |
|-----------|-------|-------|
| [Intro.co](https://intro.co/) | Expert faces, verified badge, rate clarity | Phone-first booking flow |
| [Linear](https://linear.app/) | Scroll-scrub product story, crisp motion | Issue tracker UI literalism |
| Phia (editorial) | Prompt bar + fashion portrait composition | Generic e-commerce vibes |
| ChatGPT / Gemini | — | Chat bubble UI, streaming cursor, “assistant” role |

---

## Open questions for Carlos

1. **Expert match preview:** Show a real roster expert after submit (Chris/Eiman rotation) or abstract “Verified expert network”?
2. **Account CTA timing:** Card footer link only, or also keep hero buttons for cold visitors who don’t type?
3. **Scope:** Landing only, or extend motion system to `/experts` and `/talk-with-chris`?

---

## Decision ledger

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | Expert relay, not AI chat | Differentiates from LLM tools; matches product truth |
| D2 | Goal card = post-submit stage | User feedback: popup CTA too harsh |
| D3 | Drop scroll blur | Performance + premium sites use crisp motion |
| D4 | Phased PR stack | Ship narrative fix before scroll-scrub engineering |
| D5 | No GSAP at launch | CSS + IO covers needs; add library only if scrub pins fail in Safari |

## Test ledger

| Phase | Test |
|-------|------|
| PR1 | E2E: submit goal → user bubble + expert header visible |
| PR2 | Unit: keyword → category chip helper |
| PR3 | E2E: story section scroll progress (desktop) |
| PR4 | Visual regression 375/1280; reduced-motion snapshot |