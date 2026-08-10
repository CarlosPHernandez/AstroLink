# Design System — AstroLink

## Product Context

- **What this is:** Paid aerospace expert network — live 1:1 video with verified operators, astronauts, and specialists (not a course platform, not a chatbot).
- **Who it's for:** Ambitious learners and professionals who need real operator access; experts who want a clean booking surface.
- **Space/industry:** Expert networks (GLG / Minnect / Clarity peers) in a vertical aerospace *domain* — visual language is **human marketplace**, not aerospace cosplay.
- **Project type:** Marketing landing + product web app (assessment funnel, booking, dashboards, sessions).
- **Memorable thing:** Real people, live 1:1 — faces and trust, not rockets, stars, or grids.

## Aesthetic Direction

- **Direction:** Clean light human marketplace.
- **Decoration level:** Minimal — hairline borders, soft shadows only.
- **Mood:** Calm, simple, high-trust. Aesthetic first; domain second. Experts read as bookable people, not UI chrome or mission-control theater.
- **Explicitly rejected:**
  - Hardcore aerospace theming (star fields, night stages, HUD chrome, particle fields, rocket illustration as brand)
  - Marketing **grids** as composition (3-column icon+title+blurb feature grids, dense SaaS card mosaics)
  - Continuous horizontal face strip, hard diagonal skew panels, multi-face press bench experiments (2026-07)
  - Purple/violet gradients, AI-slop bubbly everything, centered cookie-cutter section stacks
  - Font migration off Montserrat without explicit founder approval
- **Reference posture:** Peers prove faces + live proof matter; AstroLink differentiates with clean light surfaces and real portraits — not category cosplay.

## Typography

- **Display / Hero:** Montserrat (`--font-montserrat` / landing display).
- **Body / UI:** Montserrat (same family; weight and size create hierarchy).
- **Data / Tables:** Montserrat with tabular nums where rates/slots appear.
- **Mono / labels:** JetBrains Mono (or existing mono) only for tiny chips, tracking labels, technical IDs — not body.
- **Loading:** Next font pipeline (`next/font` Montserrat). Do not introduce a new display family without approval.
- **Scale (landing):** Hero ~1.5–2.35rem responsive; body 0.875–1rem; chips/labels 10–12px mono uppercase sparingly.
- **Note:** Montserrat is common; we keep it by founder preference (continuity > font novelty this pass).

## Color

- **Approach:** Restrained-plus — cool light neutrals + one accent used **more deliberately**, not more hues.
- **Canvas:** `#F7F8FA` (`--landing-canvas`)
- **Surface:** `#FFFFFF` (`--landing-surface`)
- **Surface soft:** `#F1F3F6` (`--landing-surface-soft`)
- **Accent soft (optional wash):** `color-mix(in srgb, var(--landing-accent) 6%, var(--landing-surface-soft))` — at most **one** mid-page strip (e.g. assessment reinforce). Never full-page tint.
- **Border:** `#DDE2EA` (`--landing-border`)
- **Text:** `#171A1F` (`--landing-text`)
- **Muted:** `#66717F` (`--landing-muted`)
- **Faint:** `#9AA3AE` (`--landing-faint`)
- **Ink (primary CTA fill):** `#0E1420` (`--landing-ink`) — primary actions stay near-black for weight
- **Accent:** `#1859D4` (`--landing-accent`) / hover `#1247AE` (`--landing-accent-hover`)
- **Where accent may show (encouraged, still rare):**
  - Free / status chips
  - Secondary CTAs and top bar assessment link
  - Focus rings and verified marks
  - Inline text links
  - Soft wash on a single reinforce strip
- **Where accent must not dominate:**
  - Full-bleed backgrounds
  - Every button (ink remains primary CTA)
  - Decorative left borders on every card
  - Gradients as atmosphere
- **Semantic (app chrome):** success / warning / error use product tokens; landing stays restrained.
- **Dark mode:** Not required for marketing. App chrome may keep existing patterns.
- **Do not use:** star fields, purple/violet gradients, radial night glows, multi-color brand rainbows, second brand primary.

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable on marketing; denser in dashboards
- **Prefer:** Short horizontal bars and compact sections over tall one-column prose stacks
- **Avoid:** `max-w-xl` text columns stacked with eyebrow + long h2 + body paragraph as a “section” (creates accidental tall one-column layout)
- **Hero:** Enough air for type and one constrained portrait card (`max-h` on visual) — not full-viewport portrait stacks

## Layout

- **Approach:** **Section flow** (marketing), with grids where the 2026-08-10 redesign calls for them (feature grid, intro grid, hackathon capability grid, expert directory) — see Decisions Log.
- **Marketing rule (superseded 2026-08-10):** the prior "no 3-column icon feature grids / no dense card mosaics" rule no longer applies to the landing page — the current shipping structure intentionally includes a 3-card intro grid, a 6-item feature grid, and a 6-cell hackathon capability grid, adopted wholesale from the Claude design-workspace redesign by explicit founder direction. Composition is still type + real faces first; grids are used for genuinely list-shaped content (features, capabilities), not as decorative filler.
- **Landing structure (current shipping, 2026-08-10 redesign, revised same day):**
  1. Assessment top bar — white surface, ink FREE pill, plain "Start now →" link (matches mockup exactly, not a button)
  2. Header
  3. Search hero (headline "Talk to {role}.", search bar → `/experts?q=`, 3 audience chips → `/assessment`, primary CTA + Browse experts link)
  4. Rotating expert chat-preview card (portrait + illustrative Q&A mock, Chris → Priya → Eiman → Andrew, 5s crossfade)
  5. Hackathon section (Gemini/XPRIZE logos, status pills, APX-0N capability grid, Devpost link)
  6. 3-card numbered intro grid (01/02/03)
  7. "Do the math" cost comparison (conference route vs AstroLink route)
  8. "What you get" feature grid (6 items, numbered circular badges)
  9. Expert directory grid (5-up, real people, Verified badge)
  10. Free assessment CTA (centered bordered card)
  - **Not shipping:** session reviews section and the before/after draggable comparison — both were added during the 2026-08-10 redesign pass, then pulled same day per founder feedback (no good reason to have reviews directly under the hero; the slider added a section without earning its place). Real review data/component (`expert_reviews`, `ExpertReviews`) is unaffected and still live on the expert profile page.
- **Max content width:** ~1200px shell
- **Border radius:** Small on portraits/frames (`rounded-sm` / ~8–12px); pills for CTAs and chips only
- **Mid-page assessment strip:** Horizontal CTA bar only (chip + short title + meta + CTA). No stacked long prose.

## Motion

- **Approach:** Intentional / minimal-functional
- **Allowed:** Hero portrait opacity crossfade; short hover opacity; reduced-motion → static first frame
- **No:** Continuous phone float on mobile, parallax cosplay, looping multi-face carousels as strip, scroll-jack story stages
- **Easing / duration:** Existing tokens (`--landing-ease-out`, fast/medium)

## Components (landing)

| Element | Treatment |
|--------|-----------|
| Primary CTA | Ink fill pill (`--landing-ink`) |
| Secondary CTA | Surface + border; accent text or border only when needed |
| Free / assessment chips | Accent fill or ink fill; tiny mono label |
| Assessment top bar | Surface + short copy; accent CTA ok |
| Hero visual | Single rotating portrait (Chris → Priya → Eiman); constrained height |
| Review block | One featured quote when n=1; no fake testimonial grids |
| Expert cards | Real photo, hairline border, soft shadow — people, not icons |
| Mid assessment strip | Horizontal bar only |

## Anti-patterns (do not ship)

1. ~~3-column feature grid with icons in colored circles~~ — **superseded 2026-08-10**: the shipping landing page uses a 3-card intro grid and a 6-item feature grid by explicit founder direction (full mockup adoption). Still avoid icon-in-colored-circle decoration specifically; the shipping grids use plain numbered badges, not colored icon circles.
2. Aerospace night sky / stars / HUD / mission-control chrome on marketing
3. ~~Tall one-column prose sections under the fold~~ — **superseded 2026-08-10** for the "do the math" cost-comparison section specifically, which is intentionally a two-card comparison block; still avoid tall prose stacks elsewhere.
4. Goal-form + floating phone relay as primary conversion (deprecated; assessment is magnet — this one still holds, the new search bar routes to `/experts?q=`, it is not a goal-relay chat)
5. Fabricated multi-card testimonial walls — **not superseded**, still in force. Session reviews (landing) and Session feedback (expert profile) use real `expert_reviews` rows only; both render nothing when there's no real data.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-24 | Memorable: real people, live 1:1 | Product wedge; faces over chrome |
| 2026-07-24 | Reject strip, skew, stars, dark stage, font change | Founder taste |
| 2026-07-24 | Keep Montserrat | Explicit constraint |
| 2026-08-08 | Assessment magnet hero; rotate Chris → Priya → Eiman | Free assessment converts; single-frame rotation ≠ multi-face strip |
| 2026-08-08 | Mid-page strip = horizontal bar only | Kill tall one-column prose |
| 2026-08-08 | **DESIGN.md update: clean light + restrained accent lift** | Founder: like current system; no grids; no hardcore aerospace; more accent without overdoing |
| 2026-08-08 | Layout = section flow, ban marketing feature grids | Avoid AI-slop / SaaS grid feel |
| 2026-08-08 | Accent soft wash optional, max one strip | Color lift without new brand hues |
| 2026-08-10 | **Full adoption of Claude design-workspace redesign for landing + expert profile** | Founder-directed: implement the full mockup structure (search hero, rotating chat-preview card, expanded hackathon section, 3-card intro grid, cost comparison, before/after slider, feature grid, expert directory grid) — supersedes the 2026-08-08 restraint pass's grid/prose bans for these specific sections. Real reviews and no-fabricated-testimonials rules are unchanged. |
| 2026-08-10 | Expert profile page re-themed dark → light | Prior profile page ("prototype C") used a standalone dark palette unrelated to `--landing-*`; redesign converts it to the same light tokens as the landing page for brand consistency. Scoped via `.experts-profile--light` modifier so `/experts/[slug]/video-request` (shares many `.experts-pro-*` classes) keeps its existing dark theme untouched. |
| 2026-08-10 | Drop before/after slider + landing reviews section same-day | Founder feedback: no reason for a reviews section directly under the hero; the draggable slider didn't earn its section. Both removed from `landing-page.tsx`; real reviews stay live on the expert profile page only. |
| 2026-08-10 | Montserrat 800 weight added; hero H1 + wordmark set to 800 | Font loader (`layout.tsx`) only loaded up to 700, so mockup headings specified at 800 were rendering with browser-synthesized bold instead of the true Montserrat ExtraBold cut. Fixed to match the mockup exactly. |
| 2026-08-10 | Top bar rebuilt to match mockup exactly | Prior implementation used an accent-blue wash background and a filled button CTA; mockup specifies a plain white bar, an ink-filled FREE pill, and a plain text "Start now →" link. Corrected for full color/typography fidelity to the source mockup. |

## Implementation notes

- Tokens live in `src/app/globals.css` under `--landing-*`. Prefer tokens over one-off hex.
- When adding accent, prefer **reuse of `--landing-accent`** over inventing a second blue.
- Before any visual change: re-read this file. Deviations need explicit founder approval.
- Prior multi-expert hero thrash is closed; do not revive strip/skew/bench without a new approved mock.
