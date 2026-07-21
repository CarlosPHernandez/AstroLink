# Design System — AstroLink Expert Dashboard

Scoped to the **expert (mentor) dashboard** (`/dashboard/mentor`) and related expert ops UI. Product marketing and activation flows may keep their own chrome; do not copy activation’s logo-centered layout into the dashboard.

## Product Context

- **What this is:** Ops surface for verified aerospace experts after activation.
- **Who it's for:** Mentors managing sessions, earnings, and public profile.
- **Space/industry:** Expert marketplace / professional services access (aerospace vertical).
- **Project type:** Web app dashboard (not marketing site, not onboarding wizard).
- **Memorable thing:** **Clear ops control** — the expert always knows where Sessions, money, and Profile live.

## Aesthetic Direction

- **Direction:** Industrial / utilitarian calm
- **Decoration level:** Intentional (hairline borders, light surface panels for cards/status only)
- **Mood:** Serious software for serious work. Function-first. Not activation marketing, not HUD cosplay.
- **Canvas:** **Pure white** page background (`#ffffff`). Do not use gray full-page wash behind the dashboard shell.
- **Reference patterns:** Creator/seller dashboards (Calendly-style, Stripe Connect seller) for nav chrome — solid/pill controls, not blog underline tabs.

## Explicit non-goals (dashboard)

- **No logo / wordmark** in the dashboard header (logo belongs on public/marketing/activation only).
- **No thin text-only underline tabs** as primary IA.
- **No ghost text** for primary account exit (Sign out must read as a control).

## Typography

- **UI / body:** Product stack already in use (prefer DM Sans or existing body token if loaded; avoid introducing Inter / Space Grotesk as “new brand”).
- **Data / mono accents:** IBM Plex Mono or existing mono for email/meta.
- **Scale (dashboard):**

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Page title | 24–28px (1.5–1.75rem) | 600 | “Welcome back, {name}” — owns the header |
| Section title | 18px (1.125rem) | 600 | e.g. Sessions, Earnings |
| Group label | 11px (0.6875rem) | 600 | Uppercase, letter-spacing ~0.1em (Upcoming / Past) |
| Body | 15px (0.9375rem) | 400 | Secondary copy |
| Button label | 13px (0.8125rem) | 600 | All defined buttons |

## Color

- **Approach:** Restrained — primary only for active nav + primary CTAs
- **Canvas / surface:** `#ffffff` (white)
- **Surface low (cards / status well only):** `#f4f3f8` — never full-page background
- **Surface container (nav track):** `#eeedf3`
- **On surface:** `#1a1b1f`
- **On surface variant:** `#414755`
- **Outline variant:** `#c1c6d7`
- **Primary:** `#0058bc` — active segment + primary buttons only
- **On primary:** `#ffffff`
- **Success:** `#0f7a45` (setup chips, connected payouts)
- **Warning:** `#9a6700`
- **Error:** `#ba1a1a` (use existing error tokens when present)

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable-ops (denser than activation wizard; looser than pure data grid)
- **Shell max width:** ~56rem content column, centered
- **Card padding:** 16–20px
- **Section stack:** 24–40px between major blocks

## Layout

- **Approach:** Grid-disciplined app shell
- **Structure:**
  1. **Top bar:** Page title + subtitle (left) · email + Sign out secondary button (right)
  2. **Optional setup status card** (only while incomplete)
  3. **Primary nav:** Segmented control (Sessions | Earnings | Profile)
  4. **Main:** Section title + meta → group labels → cards → actions
- **Border radius:** sm 6px · md 8px · lg 12px · full pills 9999px
- **IA (locked):** Sessions · Earnings · Profile. Payout status is contextual (Earnings / Profile), not a fourth top tab unless product expands.

## Components

### Primary navigation (required)

- Segmented **pill track** (`surface-container`) with **filled primary** active segment.
- Inactive segments: on-surface-variant text, no underline.
- Min touch target ~44px height including track padding.
- Must look like a control, not body links.

### Buttons

| Kind | Style | Use |
|------|--------|-----|
| **Primary** | Solid `#0058bc`, white text, 8px radius, min-height 44px | View prep, Save profile, Update password, Connect bank |
| **Secondary** | Transparent fill, 1px outline-variant border, on-surface text | Sign out, Open room, Recap, Cancel |
| **Ghost** | No border, muted text | Rare tertiary only — never Sign out, never main nav |

### Setup status

- Card on white canvas with light surface-low fill (optional) or white + border.
- Labeled chips: done = success tint; pending = dashed outline.
- Do not rely on skewed marketing segments alone without readable labels.

### Session cards

- White card, 1px outline, 12px radius.
- Left: name + when; right: secondary + primary actions.

## Motion

- **Approach:** Minimal-functional
- Tab switch and button press only; no scroll theater.

## Implementation map (code)

| Concern | Files |
|---------|--------|
| Shell / CSS | `src/components/dashboard/mentor-dashboard.css` |
| Layout / header | `src/app/dashboard/mentor/mentor-dashboard-client.tsx` |
| Tabs | `src/app/dashboard/mentor/mentor-dashboard-nav.tsx` |

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-21 | Expert dashboard design system (this doc) | /design-consultation; memorable = clear ops control |
| 2026-07-21 | Remove logo from dashboard | User: logo weird / does not fit ops shell |
| 2026-07-21 | Segmented pill nav over underline tabs | Peer ops dashboards; hierarchy / “real buttons” |
| 2026-07-21 | Pure white canvas | User: white background please; panels may use surface-low only |
| 2026-07-21 | Sign out = secondary outline button | Ghost text lacks affordance |
| 2026-07-21 | Keep product primary `#0058bc` | Continuity with booking / activation brand |
