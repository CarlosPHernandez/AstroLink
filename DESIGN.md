# Design System — AstroLink

## Product Context

- **What this is:** Paid aerospace expert network — live 1:1 video with verified operators, astronauts, and specialists (not a course platform, not a chatbot).
- **Who it's for:** Ambitious learners and professionals who need real operator access; experts who want a clean booking surface.
- **Space/industry:** Expert networks (GLG / Minnect / Clarity peers) in a vertical aerospace wedge.
- **Project type:** Marketing landing + product web app (booking, dashboards, sessions).
- **Memorable thing:** Real aerospace people, live 1:1 — not a course, not a chatbot.

## Aesthetic Direction

- **Direction:** Clean light marketplace with press-portrait multi-expert hero (Phia multi-face *structure*, not Phia dark/glass atmosphere).
- **Decoration level:** Minimal — hairline borders, soft shadows only.
- **Mood:** Calm, human, high-trust. Faces read as bookable people, not UI chrome.
- **Explicitly rejected (2026-07-24 design consultation):**
  - Continuous horizontal face strip under the form
  - Hard diagonal skew panels (`skewX(-14°)`) on the light landing
  - Full-page or inset dark “night stage,” star fields, and decorative gradients on the hero
  - Font migration off Montserrat for now
- **Reference notes:** Peer research (Clarity single-hero photo, Maven multi-face grid, GrowthMentor phone/live proof). AstroLink differentiates with goal → match theater on a small upright bench of real portraits.

## Typography

- **Display / Hero:** Montserrat (existing `--font-montserrat` / landing display) — keep current stack; no serif swap in this pass.
- **Body / UI:** Montserrat (same as today).
- **Data / Tables:** Montserrat with tabular nums where rates/slots appear; JetBrains Mono only where code/mono already ships.
- **Loading:** Existing Next font pipeline (`next/font` Montserrat) — do not introduce new display families without explicit approval.
- **Scale:** Follow current landing type ramp (hero ~1.2–2.65rem responsive; body 0.875–1rem; chips/labels 11–12px).

## Color

- **Approach:** Restrained — one accent + cool neutrals.
- **Canvas:** `#F7F8FA` (`--landing-canvas`)
- **Surface:** `#FFFFFF` (`--landing-surface`)
- **Surface soft:** `#F1F3F6` (`--landing-surface-soft`)
- **Border:** `#DDE2EA` (`--landing-border`)
- **Text:** `#171A1F` (`--landing-text`)
- **Muted:** `#66717F` (`--landing-muted`)
- **Faint:** `#9AA3AE` (`--landing-faint`)
- **Ink (primary CTA fill):** `#0E1420` (`--landing-ink`)
- **Accent:** `#1859D4` (`--landing-accent`) / hover `#1247AE`
- **Semantic:** Use existing product success/warning/error tokens in app chrome; landing stays restrained.
- **Dark mode:** Not required for marketing hero in this pass. App chrome may keep existing patterns.
- **Do not use on hero:** star-particle fields, purple/violet gradients, radial night glows, decorative gradient fades as primary atmosphere.

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable on marketing; denser in dashboards where already established
- **Hero:** Generous vertical rhythm so the goal form stays primary and portrait frames can breathe (real gaps between frames, not edge-butted strip)

## Layout

- **Approach:** Hybrid — centered marketing hero; grid-disciplined expert directory and booking
- **Hero structure (locked):**
  1. Headline + subcopy (center)
  2. Goal form + path chips (center, primary CTA)
  3. **Multi-expert upright portrait bench** under the form (replace single Chris billboard and failed strip/skew experiments)
  4. Phone overlay for expert-relay / live 1:1 proof (keep)
  5. Trust line
- **Max content width:** Align with existing landing (~1200px shell; form prose width)
- **Border radius:** Prefer small radii on portrait frames (`rounded-sm` / ~6–8px); pill only for form and chips (existing pattern)

## Multi-expert hero

**Status (2026-07-24): deferred.** All live hero experiments failed taste review:

| Tried | Result |
|-------|--------|
| Continuous face strip | Rejected |
| OG hard-skew panels | Rejected |
| Upright press-card bench | Rejected (static / not seamless) |
| Seamless crossfade stage | Rejected |
| Availability-bar −20° portrait segments | Rejected |

**Shipping hero (updated 2026-08-08):** assessment-magnet hero. Visual card rotates **Chris → Priya → Eiman** via `landingHeroRotationPortraits` (single frame at a time — not a multi-face strip/bench). No goal-form phone relay.

**Still rejected:** continuous face strip, hard skew panels, multi-face press bench, diagonal segments. Rotation is a single portrait crossfade, not those patterns.

**Mid-page assessment strip:** must stay a **horizontal CTA bar** (label + short title + CTA). Do **not** use `max-w-xl` / stacked eyebrow + long h2 + body paragraph — that recreates the tall one-column prose issue.

## Motion

- **Approach:** Intentional / minimal-functional
- **Match theater:** opacity + slight scale/border only
- **No:** continuous phone float on mobile if it fights readability; no looping portrait carousel
- **Reduced motion:** static frames; instant state change without scale animation
- **Easing / duration:** Prefer existing landing tokens (`--landing-ease-out`, fast/medium)

## Components (landing)

| Element | Treatment |
|--------|-----------|
| Goal form | Existing pill on light surface |
| Path chips | Existing outline chips |
| Expert frames | Upright cards, light canvas, hairline border, soft shadow |
| Featured frame | Stronger border (ink) and/or slight size increase |
| Dimmed frame | Lower opacity after match |
| Phone shell | Existing light shell; z-index above frames |

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-24 | Memorable: real people, live 1:1 | Product wedge; drives human faces + relay phone |
| 2026-07-24 | Research peers (Clarity, GrowthMentor, Maven, Minnect) | Table stakes = faces + live proof; opportunity = goal→match bench |
| 2026-07-24 | Reject continuous strip + hard skew | Looked cheap / wrong on light landing |
| 2026-07-24 | Reject stars, gradients, font change | User taste constraints in consultation |
| 2026-07-24 | Reject hybrid dark expert box | Felt like a wrong partial application of “dark” |
| 2026-07-24 | **Full light hero + upright multi-expert frames** | Continuity with shipping canvas; multi-face without night risk |
| 2026-07-24 | Keep Montserrat | Explicit user constraint this pass |
| 2026-07-24 | **Pivot: seamless stage + crossfade** (not card bench) | Card bench felt static/not seamless; single stage is dynamic + continuous with form/phone |
| 2026-07-24 | **Pivot: diagonal availability-bar segments** | User asked for segmented diagonal like availability bars (−20° + counter-skew faces) |
| 2026-07-24 | **Revert multi-expert hero; ship single Chris portrait** | All multi-expert hero variants rejected; stop thrash |

## Implementation note

Current code on `homepage-design` still contains the failed diagonal strip treatment. Next implementation step: replace with full-light upright press-bench per this document (and remove skew CSS). Do not reintroduce dark stage unless a later design review reopens D8/D9.
