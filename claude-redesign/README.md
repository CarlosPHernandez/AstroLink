# Handoff: AstroLink Landing + Expert Profile Redesign

## Overview
Redesign of AstroLink's marketing landing page and expert profile/booking page for the Build with Gemini XPRIZE hackathon. Goal: move from a generic SaaS look to a premium, verified-expert marketplace feel (intro.co / Y Combinator inspired), with one clear primary CTA ("Start free assessment") and a single verified-expert booking flow.

## About the Design Files
The files in this bundle (`Landing.dc.html`, `Expert Profile.dc.html`) are **design references built in HTML** — high-fidelity prototypes of layout, copy, and interaction, not production code to paste into the app. The task is to **recreate these designs in the target codebase's existing frontend stack** (React, Vue, etc.) using its component patterns, routing, and state management. If no frontend exists yet, choose the framework best suited to the product and implement there.

Each HTML file is self-contained: open directly in a browser to see it live. View source for exact markup/CSS if a measurement below is ambiguous.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy are final for this round. Two placeholder areas exist and are called out below: (1) two of six expert-grid photos (Andrew Parris, David Guajardo) have no real photo yet, and (2) the "Session feedback" section on the Expert Profile page uses placeholder review data — do not treat the specific quotes, "4.9", or "12 completed sessions" as real content.

## Design Tokens

Colors (CSS custom properties defined inline on the root wrapper of each page):
- `--al-canvas` / `--al-surface`: `#FFFFFF` — page and card background
- `--al-surface-soft`: `#F1F3F6` — subtle fill (image placeholders, tag chips, table cells)
- `--al-border`: `#DDE2EA`
- `--al-text`: `#171A1F` — primary text
- `--al-muted`: `#66717F` — secondary text
- `--al-faint`: `#9AA3AE` — tertiary/label text
- `--al-ink`: `#0E1420` — near-black, used for primary buttons and dark UI accents
- `--al-ink-hover`: `#000000`
- `--al-accent`: `#1859D4` — brand blue (links, "verified" tags, active states)
- `--al-accent-hover`: `#1247AE`

Typography:
- Font family: **Montserrat** (400, 500, 600, 700, 800), loaded from Google Fonts, `system-ui, sans-serif` fallback
- Headings: 700–800 weight, letter-spacing -0.01 to -0.02em, sizes from 23px (section h2) up to `clamp(34px,5.5vw,56px)` (hero h1)
- Eyebrow/label text: 11px, 600–700 weight, letter-spacing 0.08–0.14em, uppercase
- Body: 14–17px, line-height 1.6–1.7, `--al-muted` color

Spacing / shape:
- Section padding: `clamp(48px,6vw,80px) 24px` (standard), hero uses `clamp(40px,7vw,88px)`
- Content max-width: 1100px (most sections), 1200px (nav/footer), 800px (hero copy), 720px (assessment CTA)
- Border radius: 999px (pills — buttons, tags, chips), 24px (large cards/hero image), 20px (booking card), 16px (feature/comparison cards), 14px (expert grid cards)
- Card border: 1px solid `--al-border`; hover state adds a soft shadow (`0 12px 32px -18px rgba(14,20,32,0.18)`) and darkens border to `#cfd5df`
- Shadows: soft, low-opacity, large-blur (e.g. `0 22px 56px -18px rgba(14,20,32,0.18)`) — no hard drop shadows

Icons: inline SVG, Lucide-style line icons (stroke-width 2, round caps/joins) — arrow-right, star, chevron-left, play, checkmark.

## Screens / Views

### 1. Landing Page (`Landing.dc.html`)

**Purpose:** Convert visitors into either (a) starting the free assessment or (b) browsing/booking an expert directly.

**Structure, top to bottom:**
1. **Top announcement bar** — full-width, 1px bottom border, centered row: black "FREE" pill badge + "Space Path Assessment — know where you stand in 2–3 minutes" + "Start now →" link.
2. **Nav** — logo "AstroLink" (800 weight) left; right-aligned links (Experts, Press, Sign in) + primary pill button (dark `--al-ink` fill) with the CTA label prop, default "Start free assessment".
3. **Hero** — centered, max-width 800px. Eyebrow "Verified expert network · aerospace" (accent blue) → H1 "Talk to {rotating role}." (role text is a live prop, e.g. "flight controllers") → subhead paragraph → pill-shaped search bar (placeholder "What do you want to learn?" + circular dark search button) → 3 filter chips (Student / Career switcher / Team org) → primary CTA button + "Browse experts" text link side by side → trust line "Verified experts · Live 1:1 video · Clear pricing".
4. **Rotating expert preview** — two-column grid (portrait image left, chat-mockup card right) below the hero. Cycles every 5s through 4 experts (Chris Sembroski, Eiman Jahangir, Andrew Parris, David Guajardo) with a 320ms fade-out/fade-in crossfade. The right card mimics a chat bubble exchange: avatar+name+role+"VERIFIED" tag header, a dark question bubble, a bordered answer bubble, and a "Book a session with {FirstName}" button.
5. **Hackathon section** (toggleable via `showHackathon` prop, default on) — "Proudly participating in" label, two logo boxes (Gemini, XPRIZE — each rendered at a fixed 64px height × 180px width, `object-fit: contain`, equal visual weight) separated by a vertical divider. Below: a bordered card with 3 status pills (Professional Services Access / $2M prize pool / Deadline Aug 17, 2026), a heading + paragraph describing the Gemini integration, a 6-cell grid of "APX-0N" capability tiles (Booking, Briefing, Session, Translation, Notifications, Compliance), and a Devpost link.
6. **3-card intro grid** — numbered (01/02/03) cards: "Verified operators", "Real career paths", "Browse before you book" — plain bordered cards, hover lift.
7. **"Do the math" comparison** — eyebrow + H2 "One conference ticket. Zero guarantees." + explainer paragraph (conference costs ~$1,600 average). Two side-by-side cards: "THE CONFERENCE ROUTE" (neutral tag, itemized cost list: Registration $500–2500, Flights+hotel $300–2000, Meals $50–150/day, total ≈$1,600) vs "THE ASTROLINK ROUTE" (accent-blue border + shadow, tag filled accent blue, itemized value list ending "$0" cost / "You pick them" / "Dedicated, 1:1").
8. **Before/after comparison** — 2-card row: "GENERIC SEARCH" (dimmed, 0.85 opacity) vs "ASTRO-LINK" (accent border+shadow) — same visual pattern as the math section.
9. **"What you get" features grid** (`#features`) — eyebrow "What you get" (accent) + H2 "Everything around the call, handled." + 6-item grid, each with a circular numbered badge (dark fill, 01–06) + bold title + description: Live 1:1 video, AI-generated pre-call brief, Verified profiles, Session recap & action items, Live captions & translation, Clear pricing.
10. **Expert directory grid** (`#experts`) — eyebrow + H2 "Browse real people. Book a live 1:1." + 5-up card grid (`repeat(auto-fill,minmax(180px,1fr))`), each card: 3:4 portrait image, "VERIFIED" tag, name, role/employer line. Experts shown: Eiman Jahangir, Andrew "Titan" Parris, Chris Sembroski, David F. Guajardo, Dr. Jenni Hesterman. **Andrew and David currently have no photo** (placeholder text only) — real photos needed before ship. Below the grid: accent-blue "Browse all experts" pill button + "Create a free account to book a session" text link.
11. **Free assessment CTA** (`#assessment`) — centered bordered card, eyebrow "Free readiness report" + H2 "Find out where you stand." + paragraph + primary CTA button (same `ctaLabel` prop as nav/hero).
12. **Footer** — "AstroLink" wordmark + "Entrant in Build with Gemini XPRIZE — Learn more" link, left; Experts/Press/Privacy/Sign in links, right.

**Tweakable props** (editable in the design tool's Tweaks panel; recreate as component props/config in code):
- `ctaLabel` (text, default "Start free assessment") — used on nav button, hero button, and assessment CTA button (single source, so changing it updates all three).
- `heroHeadline` (text, default "flight controllers") — the word(s) after "Talk to" in the H1.
- `showHackathon` (boolean, default true) — toggles the entire hackathon section on/off.

**Rotation state/behavior:** an interval every 5000ms triggers a 320ms fade-out (opacity → 0), then swaps to the next expert in a 4-item array and fades back in. Loops indefinitely; index wraps with modulo. This needs to be reimplemented as component state (e.g. `useEffect` + `setInterval` in React) — it's currently local `state.index`/`state.visible` in the prototype, not fetched data.

### 2. Expert Profile Page (`Expert Profile.dc.html`)

**Purpose:** Let a visitor learn about one verified expert and book a paid 1:1 video session with a live duration/price calculator.

**Structure, top to bottom:**
1. **Nav** — logo + "← Directory" link, left; "Sign in" + dark "Book session" pill button, right.
2. **Full-bleed cover photo** — 16:7 aspect ratio, rounded 24px, dark gradient overlay (bottom-heavy, `rgba(14,20,32,0.82)` at bottom fading to transparent at 70% height) for text legibility. Circular white "play intro video" button, top-right. Overlaid at bottom-left: "Verified AstroLink expert" pill badge, expert name (H1, up to 42px), role · employer line.
3. **Two-column body** (content left ~flexible, booking card right, fixed 300–360px) below the cover, pulled up with a `-40px` negative margin so the booking card overlaps the cover photo edge.
   - **Left column:** intro paragraph, 3 topic tag chips (Astronaut / Aerospace engineering / Career transition), "What you can ask about" bullet list (3 items), "Bio" label + italic placeholder bio paragraph (flagged as placeholder — needs the real bio before publishing).
   - **Right column — booking card** (sticky, `top: 24px`, white card with border + shadow): "Session length" label, a 10-segment progress bar (dark-filled segments proportional to selected minutes / 60 max), a −/+ stepper controlling minutes (15 min steps, 15 min min, 60 min max) with the current minute count shown large in the center, helper text "15 min minimum · 15 min steps · up to 60 min", a computed price line (`$price session`, then `$rate/hr · prorated to N min`), a full-width dark "Book N min · $price" button, reassurance line ("Encrypted video · AI briefing included · Refundable up to 24 hours before start"), and a secondary outlined "Get a personalized video" button.
4. **Session feedback section** (light-gray background) — flagged in-page as "Example layout — replace with real session feedback once available." Shows an average rating (4.9), a 5-star row, "Based on 12 completed sessions" caption, and 2 review cards (5-star and 4.5-star) each with a placeholder quote, "AstroLink member" attribution, and a "Verified session" checkmark tag. **All content here is placeholder — do not ship the specific numbers or quotes.**
5. **Footer** — same pattern as landing page footer, with "Directory" instead of "Experts" as the first link.

**Tweakable props:**
- `expertName` (text, default "Chris Sembroski")
- `expertRole` (text, default "Inspiration4 Astronaut & Aerospace Engineer")
- `expertEmployer` (text, default "Inspiration4 / Lockheed Martin / Starfish Space")
- `expertRate` (number, default 250, range 50–1000, step 10, unit "$/hr")

**Price calculator logic** (reimplement as component state):
- State: `minutes`, initialized to 30.
- Stepper buttons adjust by ±15, clamped to [15, 60].
- `price = (rate / 60) * minutes`, displayed to 2 decimal places.
- Progress bar: 10 segments; `filled = round((minutes / 60) * 10)` segments get the dark fill color (`#0E1420`), rest get light gray (`#E5E7EB`).
- Book button label and price line update live with `minutes`/`price`.

## Interactions & Behavior Summary
- **Landing hero carousel:** auto-advances every 5s, 320ms crossfade, no user controls (no manual arrows/dots in this version).
- **Hackathon section toggle:** boolean flag, no animation — mount/unmount.
- **Card hovers (Landing):** `.al-card`, `.al-btn-primary`, `.al-btn-ghost`, `.al-chip` all get a hover state — buttons darken fill, cards gain a soft shadow + darker border, ghost/chip elements gain a darker border and text color. Transitions are 0.15–0.2s ease.
- **Expert Profile stepper:** clicking − / + updates minutes, price, progress bar, and button label synchronously (no debounce/animation beyond a CSS `background` transition on segments).
- **Booking card sticky positioning:** stays pinned at `top: 24px` while the left column scrolls, on viewports wide enough for the 2-column layout.
- No responsive breakpoints were explicitly authored beyond CSS `clamp()` for type/spacing and `auto-fit`/`auto-fill` grid columns — genuine mobile layout (e.g. stacking the 2-column profile grid, collapsing the nav) has **not** been tested and needs review on the target implementation.

## State Management
- Landing: current carousel index + fade-visibility flag (ephemeral UI state, no persistence needed).
- Expert Profile: selected session `minutes` (ephemeral UI state; on real booking flow this would feed into a checkout/booking API call along with `expertRate` and computed `price`).
- No data fetching exists in the prototype — expert names/photos/rates and review data are hardcoded. Production implementation needs to wire these to real expert records and review data.

## Assets
- `assets/logos-google/` — Gemini and XPRIZE hackathon logos (JPEG), used at 64×180px in the Landing hackathon section. These are hackathon-sponsor logos, not product assets — swap or remove them once the hackathon-specific section is no longer needed.
- `assets/Image 3.jpeg` — Eiman Jahangir headshot (landing expert grid + rotating hero card).
- `assets/Image 6.jpeg` — Chris Sembroski headshot (landing expert grid + rotating hero card; also reused as the Expert Profile cover photo placeholder).
- **Missing:** real photos for Andrew "Titan" Parris and David F. Guajardo — both currently show text placeholders in the expert grid and rotating hero.
- Icons are inline SVG (no icon font/library dependency) — recreate with the target codebase's icon system (e.g. Lucide, which these visually match) rather than copying raw SVG paths.

## Files
- `Landing.dc.html` — full landing page prototype (open directly in a browser)
- `Expert Profile.dc.html` — full expert profile/booking page prototype (open directly in a browser)
- `assets/` — images referenced above
