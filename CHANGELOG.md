# Changelog

All notable changes to AstroLink are documented in this file.

## [0.6.10.5] - 2026-07-18

### Changed
- Mission landing: open expert browse first (real names/faces, path to `/experts` before signup), truthful 1:1-only positioning, and a defendable trust strip (no fabricated testimonials).
- Mobile landing polish: quieter hero motion, snap expert carousel with swipe affordance, larger comparison-slider drag handle, safer touch targets, and `viewport-fit: cover` safe areas.
- Shared public mobile menu (`PublicSiteHeader`) on landing and `/experts` — hamburger sheet with Experts, Press, Sign In / Unlock (or Dashboard when signed in).

### Fixed
- Landing path-chip and chat typing remount glitches; story scroll-progress e2e race on desktop scrub.

## [0.6.10.4] - 2026-07-16

### Changed
- Retired the public `/early-access` waitlist page: `/early-access`, `/early-access/player`, and `/join/[slug]` now redirect to `/talk-with-chris` (marketing `ref` params preserved). Waitlist-mode home and fallbacks route to the Chris campaign landing.

### Removed
- New public waitlist signups: `POST /api/early-access` returns 410 Gone. Existing `early_access_signups` rows and admin waitlist metrics are unchanged.

## [0.6.10.3] - 2026-07-16

### Changed
- Site-wide social previews on astro-link.space now use the Chris campaign 1200×630 OG card (`/og/talk-with-chris.png`) from the root layout and `/early-access` Open Graph metadata. Twitter Player on early-access is unchanged when Chris intro video is available; its preview image uses the OG card.

## [0.6.10.2] - 2026-07-16

### Added
- Chris campaign social preview card for `/talk-with-chris`: static 1200×630 OG image (`/og/talk-with-chris.png`) with `summary_large_image` Twitter metadata via `buildTalkWithChrisMetadata()` and shared `og-images` helpers.

## [0.6.10.1] - 2026-07-16

### Added
- Expert-facing PDF export for admin booking briefs: download a one-page session prep PDF from `/dashboard/admin` (buyer name, session time, goals, background, AI prep — no internal notes; email omitted by default). `GET /api/admin/bookings/[id]/export?format=pdf&includeEmail=false&download=1` via `booking-export-pdf.ts` (`pdf-lib`).

## [0.6.10.0] - 2026-07-16

### Added
- Admin booking brief export: paste a booking UUID on `/dashboard/admin` to copy or download a Markdown brief with buyer intake, payment status, and expert-oriented AI prep — for manually briefing experts before sessions (`GET /api/admin/bookings/[id]/export`, `booking-export.ts`).
- Expert and pre-call Markdown formatters in `briefing-display.ts` (parallel to existing mentee plain-text export).
- `BOOKING_EXPORT` audit log entry on each successful admin export (no PII in payload).

## [0.6.9.0] - 2026-07-15

### Added
- Chris campaign booking funnel analytics (Vercel custom events): `chris_booking_page_view`, `chris_auth_success`, `chris_session_continue`, `chris_checkout_start`, `chris_checkout_success`, `chris_payment_error`, and `chris_wizard_exit` — complements existing `chris_landing_view` and `chris_request_session`. No PII in event payloads (`chris-campaign-analytics.ts`, `use-chris-wizard-analytics.ts`).
- Production milestones (XPRIZE evidence) section in the Chris campaign launch checklist documenting the first paid early-access booking (2026-07-15).

### Changed
- Privacy policy discloses anonymous Chris booking funnel events via Vercel Web Analytics.

## [0.6.8.0] - 2026-07-14

### Added
- Chris campaign dual pricing: waitlist traffic (`ref=early-signups`) pays **$180** with limited-slot scarcity UI; public and social traffic (`chris-social`, `chris-sembroski`, or no ref) pay full **$200** without limited-slot chrome. Server resolves the PaymentIntent amount from `marketing_referrer` (`chris-pricing.ts`).
- Pre-booking Chris early-waitlist marketing email sequence templates (four HTML emails) plus send-test script and Resend Broadcasts runbook — paste into Resend; does not replace post-payment confirmation or AI brief emails.
- Launch go-live docs: dual-price marketing links, July 20 earliest bookable day, dual-ref smoke tests, and waitlist blast checklist in the Chris campaign launch how-to.

### Changed
- Earliest Chris session date is **2026-07-20** (America/New_York), never before today Eastern.
- Mobile `/talk-with-chris` hero copy is shorter so media stays visible; hero text fades when the intro video plays; date strip is seamless.
- Chris landing headlines emphasize a private 45-minute session for both waitlist and social audiences.
- Production default campaign slot cap documented as **15**.

### Fixed
- Demo mentee registration in the Chris wizard uses real UUIDs (not `usr-…` ids) so `public.users` inserts succeed, with a friendly error if profile creation still fails.
- Demo `userId` typing satisfies production TypeScript builds on Vercel.
- Waitlist marketing email HTML is centered for Gmail clients.

## [0.6.7.0] - 2026-07-12

### Added
- Landing hero now routes typed learning goals to verified experts (Chris Sembroski or Eiman Jahangir) with avatar, name, and word-by-word expert replies instead of a generic AI chat loop.
- Story section adds a desktop scroll-scrub comparison (generic internet answers crossfade to AstroLink expert access) and a mobile before/after drag slider.
- Landing motion tokens, chat display helpers, and pinned scroll progress utilities with unit tests.

### Changed
- Post-submit hero flow softens conversion: the goal card stays focal with a "Continue your journey" link instead of a harsh unlock panel.
- Scroll-linked landing motion drops blur filters in favor of crisp opacity and translate; benefits section uses staggered reveals and a text CTA.
- Expert relay copy and accessibility labels reframe the phone module as a human expert network, not an AI assistant preview.

## [0.6.6.0] - 2026-07-11

### Added
- Signed-out home now uses a Phia-inspired light editorial layout with Montserrat typography, scroll-linked reveal animations, and parallax depth on hero and story sections.
- Landing hero highlights Chris Sembroski with a clickable portrait, animated AI chat preview, mission prompt bar, and trust strip for verified experts, live video, and clear pricing.
- Featured expert helpers centralize Chris (hero) and Eiman (story and editor's picks) portrait sources, with unit coverage for slug and asset resolution.
- Mobile landing layouts stack hero phone and portrait cleanly, shorten the mission prompt, and disable parallax on small screens.

### Changed
- Marketing copy now says "experts" instead of "operators" across landing sections.
- Expert directory on the home page uses portrait-focused editor's picks without hourly rate badges on cards.
- E2E smoke auth expectations updated for the new hero test id and portrait-only expert cards.

### Removed
- Retired the dark comparison section and legacy landing comparison component in favor of the new editorial flow.

## [0.6.5.0] - 2026-07-07

### Added
- Chris campaign confirmation emails now render a dark, email-safe "Admit One" ticket with Chris's portrait, reserved-date details, 45-minute service copy, and a dashboard CTA.
- Confirmation email unit coverage now verifies Chris campaign date-hold behavior, absence of calendar attachments, and non-Chris email compatibility.

### Changed
- Chris launch bookings now use the $180 launch price path instead of the temporary $1 live-flow test price.
- Customer-facing Chris payment copy now describes immediate payment collection and the cancellation/refund policy instead of authorization or escrow language.
- Chris confirmation emails show the reserved date only, explain that time selection happens after Chris confirms availability, and omit UTC/calendar-file language.
- Notification delivery now loads booking campaign and duration fields so campaign-specific confirmation templates can be selected safely.
- The Chris pre-call brief email button can be used again after a successful send while showing the last sent status.

### Fixed
- Chris campaign slot accounting now reopens a slot when eligible paid bookings are cancelled or externally refunded, with idempotent release guards.
- Stripe refund and booking cancellation flows now include Chris slot-release audit context.
- Launch readiness lint issues in the payment, Chris flow, and session surfaces are cleaned so the lint gate passes.

## [0.6.4.0] - 2026-07-06

### Changed
- Chris campaign checkout now asks the server to confirm payment with bounded backoff, so paid bookings do not depend on one browser attempt.
- Browser payment confirmation now completes the same fulfillment work as Stripe webhooks, including transaction recording, booking confirmation, Daily provisioning, and confirmation notifications.

### Fixed
- Paid Chris bookings that remain `pending_payment` after Stripe succeeds can now recover through `POST /api/bookings/[id]/confirm-payment` instead of waiting indefinitely on the AI brief overlay.
- Local dev-skipped bookings now confirm server-side without a Stripe lookup, and buyers see explicit overlay errors for auth or metadata failures.

## [0.6.3.0] - 2026-07-06

### Added
- Production-safe booking payment confirmation fallback at `POST /api/bookings/[id]/confirm-payment` that verifies session access, Stripe PaymentIntent success, and AstroLink booking metadata before recording payment state.
- Unique `transactions.stripe_payment_intent_id` index to prevent duplicate ledger rows when client reconciliation and Stripe webhook replay process the same PaymentIntent.

### Changed
- Chris campaign checkout now charges the temporary $1 live-flow test amount directly on the PaymentIntent and records the original amount, charged amount, and pricing mode in Stripe metadata.
- Chris campaign payment summary now shows the actual $199 live-test adjustment so the displayed total reconciles to $1.
- Stripe webhook API paths now bypass proxy auth and waitlist handling before Stripe signature validation runs in the route handler.
- Chris campaign post-payment polling now attempts production payment reconciliation once when a paid booking remains `pending_payment`.
- Stripe production cutover docs now use the canonical no-redirect webhook URL and warn against `3xx` webhook targets.

### Fixed
- Chris campaign bookings no longer send unsupported Stripe `discounts` data when creating PaymentIntents.
- PaymentIntent regression coverage now verifies Chris campaign amount, metadata, idempotency, customer attachment, and absence of Stripe discounts.
- Paid bookings can be reconciled to `confirmed` with exactly one transaction row even if the original Stripe webhook was delayed, redirected, or replayed.
- Pending-payment bookings no longer generate APX-02 briefs before payment confirmation.
- Post-payment fulfillment skips APX-02 generation when a display-ready brief already exists, avoiding duplicate fulfillment work on replay.

### Removed
- Removed the unused Chris Stripe coupon/promotion-code helper, tests, env examples, and launch checklist instructions for configuring PaymentIntent discounts.

## [0.6.1.0] - 2026-07-06

### Changed
- Session pages now defer Daily meeting token minting until the participant actually joins the room instead of minting during the initial page load.

### Fixed
- Session page loads no longer make avoidable Daily token requests for ready bookings that users view without joining.
- Join URL generation now returns route-level errors when Daily token minting fails, keeping the session page render path lightweight.

## [0.6.0.1] - 2026-07-02

### Changed
- Join room buttons ("Join room" / "Join video room") in mentee and mentor dashboards are now always visible for confirmed/completed sessions with a room, but render as disabled (with title hint) until 15 minutes before the scheduled time. The button activates automatically (live timer in mentee dashboard).
- Added pure `src/lib/join-window.ts` helper (`isJoinRoomEnabled`, `getJoinPhase`) and `src/lib/join-window.test.ts`.
- Titles and logic now reference the configured `DEFAULT_JOIN_BEFORE_MINUTES` (default 15) for consistency with server gate.

### Fixed
- Button no longer allows early clicks that could impact Daily.co usage (UI affordance; server gate in `/session/[bookingId]` and meeting token `nbf` remain the hard enforcement).

## [0.6.0.0] - 2026-07-02

Gemini is now the primary AI provider for production agents, every LLM decision is logged for the Build with Gemini XPRIZE submission, and the early-access waitlist accepts more real-world email formats.

### Added
- Structured `LLM_DECISION` audit rows (`agent_id`, model, prompt hash, output summary) on every agent LLM call for XPRIZE T8 evidence.
- Admin export at `GET /api/admin/audit-logs/export` (JSON download for judges) and live audit log listing at `GET /api/admin/audit-logs`.
- `npm run smoke:briefing` integration test for end-to-end APX-02 via Gemini (gated by `SMOKE_BRIEFING=true`).
- Permissive waitlist email validation — accepts non-traditional domains (e.g. `user@company`) while still requiring `local@host` shape.

### Changed
- Default Gemini model is `gemini-flash-latest` (replaces `gemini-2.0-flash`, which was quota-blocked on the hackathon key).
- `.env.example` documents Gemini as the primary LLM provider for APX agents.
- Early-access signup input uses `type="text"` so browser-native email validation no longer blocks odd-but-valid addresses.

### Fixed
- Waitlist signups failing with "invalid email" for addresses without a `.com`-style TLD.

## [0.5.10.0] - 2026-07-01

Chris campaign bookers now stay in the wizard after payment: a segmented progress overlay runs through authorization and brief generation, then a compact pre-call brief modal (copy or email) and a confirmation screen with next steps — without redirecting to the generic dashboard flow.

### Added
- Chris post-payment fulfillment overlay with segmented progress, pulsing in-progress segments, and brief polling (`useChrisBookingFulfillment`, fulfillment overlay, briefing modal, next-steps screen).
- `GET /api/bookings/[id]/status` for Chris campaign booking + briefing polling.
- `POST /api/book/briefing/email` to send the mentee pre-call brief on demand.
- `formatMenteeBriefAsPlainText` helper and mentee brief email builder.
- Proxy allowlist so signed-out visitors can open `/booking?campaign=chris` in full app mode.
- E2E coverage for overlay-on-pay, in-flow brief reveal, and next steps.

### Changed
- Chris booking wizard orchestrates overlay → brief modal → next steps; generic `/booking` and dashboard `?booked=` flows unchanged.
- `BookingPaymentStep` accepts Chris-only `onPaymentStarted` / `onPaymentComplete` / `onPaymentFailed` callbacks.
- Session → payment step adds a preparing-checkout transition; brief modal is compact on desktop with taller scroll area.

### Fixed
- Signed-out users hitting Book on the Chris landing no longer redirect to `/auth` before the wizard.

## [0.5.9.1] - 2026-07-01

Production Chris signup and `/auth` registration now show specific errors instead of a generic "use a different email" when Supabase rejects sign-up (duplicate account, email rate limit, blocked test domains).

### Added
- Supabase auth error mapper with unit tests (`src/lib/supabase/auth-error-message.ts`).

### Changed
- Chris booking wizard and `/auth` actions log Supabase errors server-side and surface mapped messages for sign-up and sign-in.
- Chris launch checklist documents Supabase Auth settings (confirm email off, rate limits, preview demo auth).

### Fixed
- Unconfirmed-email sign-in on Chris wizard shows a confirm-inbox message instead of generic invalid credentials.

## [0.5.9.0] - 2026-06-30

Chris campaign launch ops: marketing referrer attribution from landing through booking, admin ops metrics panel, and sold-out waitlist routing.

### Added
- `bookings.marketing_referrer` column and partial index (migration `20260701120000`).
- Chris campaign referrer parser (`chris-sembroski`, `early-signups`) and waitlist href helper.
- Admin Chris campaign metrics: slot cap, bookings by status, bookings by marketing referrer.
- Production launch checklist at `docs/how-to/chris-campaign-launch-checklist.md`.
- PR4 scope doc at `docs/plans/chris-sembroski-launch-PR4-scope.md`.

### Changed
- `/talk-with-chris` and booking CTAs preserve `?ref=` through to `/booking` and POST `/api/book`.
- Booking agent persists `marketing_referrer` on bookings and Stripe metadata.
- Sold-out Chris forms link to `/early-access?ref=early-signups` instead of generic waitlist.
- Admin dashboard shows Chris campaign ops panel when metrics API returns campaign data.

## [0.5.8.0] - 2026-06-30

Chris Sembroski campaign visitors can now book a 45-minute session end-to-end: pick a date on the landing page, sign in or create an account inline, set session goals, and pay without leaving the campaign flow.

### Added
- Chris booking mode (`campaign=chris`): fixed 45-minute sessions, locked mentor, date param in booking URLs.
- Three-step Chris booking wizard at `/booking?campaign=chris`: Account → Session goals → Pay, with inline register/login (no redirect to `/auth`).
- Optional Stripe promo support via `CHRIS_STRIPE_COUPON_ID` / `CHRIS_STRIPE_PROMOTION_CODE` env vars.
- Shared `chris-campaign-date-strip` for scrollable July 2026+ date selection on mobile and desktop HUD.
- Stitch wizard reference assets (account, session goals, payment screens) and updated manifest.
- E2E golden path for `/talk-with-chris` landing → booking wizard.

### Changed
- `/booking` accepts signed-out Chris visitors and renders the wizard instead of requiring auth upfront.
- Desktop HUD Request Session form: email field replaced with date picker; CTA passes selected date into booking URL.
- Chris checkout uses solid dark backgrounds and Stripe night theme (`variant="chris"`).
- Landing CTAs link directly to `/booking?campaign=chris&date=…` instead of routing through `/auth`.

## [0.5.7.0] - 2026-06-30

Chris Sembroski campaign visitors on phones now get the full Stitch mobile booking screen at `/talk-with-chris`; iPad and desktop keep the HUD. Pick a July 2026 session date from the new scrollable date strip.

### Added
- Stitch mobile landing at `/talk-with-chris` for viewports under 768px: hero portrait, slot bars, scrollable question queue, glass date picker, and Book Private Session CTA.
- `chris-mobile-landing.tsx` and `chris-mobile-booking-card.tsx` — phone layout shell and month-navigable date strip.
- `chris-campaign-dates.ts` — July 2026+ booking window helpers with 12-month horizon and unit tests.
- Component variants: slot indicator (`hero`, `pill`), question queue (`scroll`), request form (`mobile`), portrait (`hero`).
- Stitch mobile reference assets (`mobileview-chris-booking-screen`) and updated manifest.
- PR2.5 scope allowlist: `docs/plans/chris-sembroski-launch-PR2.5-scope.md`.

### Changed
- `/talk-with-chris` splits at the `md` breakpoint: phone gets mobile Stitch layout; tablet and desktop keep the HUD (iPad no longer falls back to phone).
- Loading skeleton uses separate phone vs tablet/desktop layouts with explicit rem widths.
- `chris-landing.css` adds mobile tokens (`chris-mobile-max`), glass card, and queue scroll masks; avoids Tailwind spacing-token collisions that collapsed copy to one word per line.

## [0.5.6.0] - 2026-06-29

The Chris Sembroski campaign landing is now a full Stitch HUD desktop experience — live slot count, click-to-play intro video, and a Request Session path into booking.

### Added
- Stitch HUD landing at `/talk-with-chris`: slot indicator, rotating question queue, email + Request Session CTA, dark footer.
- `ExpertIntroMedia` on the Chris portrait — click to watch his intro video (same pattern as `/experts`).
- `src/components/chris-campaign/` — landing client, scoped dark theme CSS, slot indicator, form, portrait, footer.
- `chris-booking-href` helper and client-safe `chris-campaign-constants` for `campaign=chris` booking URLs.
- Route-specific dark loading skeleton and viewport theme for `/talk-with-chris`.
- PR2 scope allowlist: `docs/plans/chris-sembroski-launch-PR2-scope.md`.

### Changed
- `/talk-with-chris` replaces the PR1 placeholder with the desktop HUD layout; slots load from `getChrisCampaignSlotSnapshot()`.
- `chris-campaign-config` re-exports constants from a client-safe module.

## [0.5.5.0] - 2026-06-28

You can now run a limited Chris Sembroski booking campaign while the rest of the site stays on the waitlist. Ten slots are reserved atomically; unpaid bookings release a slot when cancelled.

### Added
- `booking_campaigns` table and atomic slot reserve/release RPCs; `bookings.campaign_id` for campaign attribution.
- `src/lib/chris-campaign/` — env config, waitlist route allowlists, slot helpers, and `campaign=chris` booking validation.
- `/talk-with-chris` placeholder landing (full Stitch UI in PR2).
- Chris campaign plan docs under `docs/plans/`.

### Changed
- `APP_MODE=waitlist` + `CHRIS_BOOKING_ENABLED=true` opens `/auth`, `/booking`, and booking APIs with Supabase auth.
- `/experts` and `/join/chris-sembroski` redirect to `/talk-with-chris` when Chris booking is enabled.
- Booking agent reserves a campaign slot before insert and releases on failure; cancel releases slots for `pending_payment` rows.

## [0.5.4.0] - 2026-06-26

Pre-session briefs are now written for you, not about you. Live sessions generate a dual-audience APX-02 bundle: a second-person mentee brief ("Based on your…") and a third-person expert prep brief, each shown in the right dashboard and session room.

### Added
- APX-02 v2 `briefing_json` bundle — `mentee` slice (personal intro, your objectives, session plan, questions to ask) and `mentor` slice (facilitation notes, mentee context).
- Shared briefing components under `src/components/briefing/` with audience-specific rendering for mentee and mentor panels.
- Mentor dashboard **View prep brief** slide-over; mentors can refresh briefs via `/api/book/briefing`.
- `briefing-auth` and expanded `briefing-display` resolvers with v1 legacy upgrade banner.

### Changed
- Booking intake `background` is now passed into briefing generation alongside goals.
- Session room sidebar is role-aware: mentees see "Your session plan", mentors see "Session prep".
- Mentor `?prep={bookingId}` deep link (from confirmation email) opens the prep brief slide-over.
- E2E briefing stub and golden-path assert the personal intro line.

### Added
- **APX-08 Notifications** — Resend confirmation emails to mentee and mentor with `.ics` calendar attachments on booking fulfillment.
- `notification_deliveries` table for idempotent send tracking (Stripe webhook retries won't double-email).
- `runConfirmedBookingFulfillment` orchestrator — briefing, Daily room, then notifications in one path.
- Mentor dashboard `?prep={bookingId}` deep link from confirmation email.
- `NOTIFICATIONS_DISABLED` env guard for local dev and E2E (Playwright pins it on).

### Changed
- `confirmBookingWithoutPayment` and `fulfillBookingAfterPayment` share the same post-confirm fulfillment tail.

## [0.5.1.0] - 2026-06-25

Session transcripts and live captions now show real names instead of generic labels, and both dashboards let you expand a transcript on completed sessions without opening the full recap page.

### Added
- `resolveSessionSpeakerLabel` — first-name labels with "You" when the mentee views their own speech; unit tests included.
- Expandable **View transcript** on mentee and mentor dashboards for completed bookings.

### Changed
- Live captions and post-call transcript panel use mentor/mentee first names (replacing Expert/Buyer).
- Session recap link on mentee past sessions no longer requires a Daily room URL.
- Completed mentor consultation cards show session recap and inline transcript.

## [0.5.0.0] - 2026-06-21

Mentor dashboard Stripe Connect restore (PR5): mentors can onboard to Stripe Express and open the payout dashboard when ops enables Connect — manual payouts remain the launch default.

### Added
- Restored `POST /api/mentor/stripe-connect` — `onboard` (account link) and `dashboard` (Express login) when `ENABLE_STRIPE_CONNECT_PAYOUTS=true`.
- Route unit tests for deferred 503, dev_skip, onboard, dashboard, and error paths.

### Changed
- Launch default unchanged: flag off → 503 with manual-payouts message; `SKIP_STRIPE_PAYMENTS` still returns `dev_skip` when Connect is enabled.
- `.env.example` documents `ENABLE_STRIPE_CONNECT_PAYOUTS` for Preview/staging Connect testing.
- PR5 activated in mentor-dashboard-ops plan docs — completes the PR1–PR5 stack.

## [0.4.10.0] - 2026-06-21

Mentor dashboard UI flex sweep (PR4): session cards and the civil servant profile row use full-width stacked layout so goals, context, and compliance copy no longer squeeze into narrow columns.

### Changed
- **Consultation cards** — stacked title/status, full-width goals and context, join CTA in its own row; human-readable booking status badges.
- **Civil servant row** — title and checkbox on one row, NF-1860 explanation full-width below (`mentor-civil-servant-row`).
- PR4 activated in mentor-dashboard-ops plan docs and scope guardrails.

## [0.4.9.0] - 2026-06-21

Mentor dashboard listing visibility (PR3): mentors see whether they are live on the expert directory, their public slug, and compliance blockers from the Profile tab.

### Added
- **Public listing** card on mentor Profile tab — compliance status, directory listing state, public URL, and preview link when live.
- `src/lib/mentor-listing-status.ts` — status labels, visibility copy, and preview eligibility helpers.
- E2E assertion for Chris seed (approved + listed on `/experts/chris-sembroski`).

### Changed
- Mentor dashboard loads `slug` and `is_listed` from `mentors` row; header compliance label uses shared helper.
- PR3 activated in mentor-dashboard-ops plan docs and scope guardrails.

## [0.4.8.0] - 2026-06-21

Mentor manual payouts (PR2): ops can mark per-session bank transfers; mentors see Transfer status per booking.

### Added
- `mentor_manual_payouts` and `mentor_payout_lines` tables (`transaction_id UNIQUE` for idempotent mark-paid).
- `src/lib/mentor-manual-payouts.ts` — list unpaid sessions, mark paid, awaiting/transferred totals.
- `GET/POST /api/admin/mentor-payouts` — admin-only payout batch API with audit log.
- Admin **Mentor payouts** panel on `/dashboard/admin`.
- E2E `admin-mentor-payouts.spec.ts` and admin auth bootstrap.

### Changed
- Mentor earnings ledger adds **Transfer** column (Awaiting / Transferred / —).
- Summary cards reconcile `awaitingTransferCents` vs `transferredCents` from payout lines.
- PR2 activated in mentor-dashboard-ops plan docs and scope guardrails.

## [0.4.7.0] - 2026-06-21

Mentor dashboard earnings truthfulness (PR1): summary cards and ledger now match immediate-capture reality; ops guardrails keep agent work scoped.

### Added
- `docs/plans/mentor-dashboard-ops/` — eng-reviewed plan, README, GUARDRAILS, and `check-scope.sh` for PR1–PR5.
- `.grok/skills/mentor-dashboard-ops` and `mentor-dashboard-ops-plan` — implementation and planning skills.
- `.cursor/rules/mentor-dashboard-ops.mdc` — cursor guardrails for the initiative.

### Changed
- Earnings summary cards: **Recorded share**, **Awaiting transfer**, **Transferred** (replaces misleading Pending capture / Paid out).
- Ledger **Payment** column shows Recorded / Refunded / Pending / Failed per row.
- `summarizeMentorEarnings` excludes refunded and failed rows from recorded totals; tracks `refundedPayoutCents` separately.

### Fixed
- Refunded transaction rows no longer inflate mentor earnings totals or session count.

## [0.4.6.0] - 2026-06-21

Mentor dashboard production hardening: deferred Connect UX, NF-1860 upload validation, E2E smoke.

### Added
- `src/lib/mentor-payouts-config.ts` — `ENABLE_STRIPE_CONNECT_PAYOUTS` gate for Connect CTAs.
- `src/lib/nf1860-upload.ts` — PDF size (10 MB) and magic-byte validation for NF-1860 uploads.
- Unit tests for mentor actions, payouts config, stripe-connect route, and NF-1860 validator.
- Playwright `e2e/mentor-dashboard.spec.ts` (9 cases).

### Changed
- Mentor earnings tab shows manual payouts card in production (no broken Connect button).
- Sidebar payout status: Dev mode / Manual payouts / Connected / Setup required.

### Fixed
- Mentor profile save when civil-servant checkbox is unchecked (`isCivilServant` null from FormData).

## [0.4.5.1] - 2026-06-20

Hotfix: serve `sitemap.xml` and `robots.txt` in waitlist mode so Google Search Console accepts the sitemap.

### Fixed
- Waitlist proxy no longer redirects `/sitemap.xml` and `/robots.txt` to early-access HTML.
- Proxy matcher excludes SEO crawl routes so Next.js metadata handlers serve XML/text directly.

## [0.4.5.0] - 2026-06-20

SEO foundation (PR1): crawlable public expert profiles in waitlist mode with canonical metadata on `astro-link.space`.

### Added
- `src/lib/seo/` metadata builder, JSON-LD helpers, and dev README.
- `robots.txt` and dynamic `sitemap.xml` for early-access, experts, join, and privacy routes.
- `expert-cta` waitlist-safe CTAs (`/early-access?ref=expert-<slug>`).
- Person + VideoObject JSON-LD on `/experts/[slug]`.
- Build with Gemini XPRIZE mention on early-access metadata only.
- Plan doc `docs/plans/seo-agent.md` and Playwright `e2e/seo-public-experts.spec.ts`.

### Changed
- Waitlist mode allows public `/experts` and `/experts/[slug]` (booking/auth still blocked).
- All public pages use production canonicals on `https://astro-link.space`; `/join/[slug]` canonical points to expert profile.
- Early-access shows Experts nav link in waitlist mode.
- Root layout sets `metadataBase` to production app URL.

## [0.4.4.0] - 2026-06-19

X (Twitter) Player Card for the early-access waitlist with Chris Sembroski's intro video.

### Added
- `/early-access/player` iframe embed for X Player Cards (Chris intro MP4 with controls).
- Dynamic Open Graph and `twitter:card=player` metadata on `/early-access`, including stream URL and thumbnail.
- Unit tests for Eastern Time formatting and player metadata fallbacks.

### Changed
- Security headers: allow X/Twitter to frame the player route via CSP `frame-ancestors` while keeping `X-Frame-Options: DENY` elsewhere.

## [0.4.3.0] - 2026-06-19

Waitlist signup security hardening for production campaigns.

### Added
- Supabase-backed cross-instance rate limits for `POST /api/early-access` (IP + per-email windows).
- Honeypot bot trap, referrer kebab-case validation, production env build guard, and baseline security headers.
- Waitlist production checklist (`docs/how-to/waitlist-production-checklist.md`).

### Changed
- Signup API returns uniform success copy (no email enumeration), generic 500 errors, and stricter request validation (JSON only, 4KB cap, POST-only).

### Security
- Migration `20260619120000_early_access_rate_limits.sql` with `early_access_consume_rate_limit` RPC.

## [0.4.2.0] - 2026-06-19

Waitlist funnel analytics for early-access and partner join pages.

### Added
- Vercel custom events for waitlist funnel: form view, form start, submit attempt/success/fail, form abandon, and page exit with dwell time and outcome.
- `useWaitlistPageAnalytics` hook and unit tests for dwell-time bucketing and referrer sanitization.

### Changed
- Privacy policy notes anonymous waitlist interaction events via Vercel Web Analytics (no email in analytics).

## [0.4.1.1] - 2026-06-18

Expert partner waitlist landings for roster distribution.

### Added
- `/join/[slug]` shareable partner pages (e.g. `/join/david-guajardo`) with personalized hero, featured intro media, and the same waitlist signup flow.
- Auto-attributed signups via `ref=expert-<slug>` for admin referrer reporting.
- Playwright E2E coverage for partner join landings.

### Changed
- Waitlist mode allows `/join/*` routes alongside `/early-access` and `/privacy`.
- `WaitlistSignupForm` accepts a default referrer when the URL has no `?ref=` param.

## [0.4.1.0] - 2026-06-18

Waitlist landing redesign, privacy policy, and ops signup dashboard.

### Added
- Redesigned `/early-access` waitlist — hero, single opt-in email signup with submit animation, Chris Sembroski featured intro video, and scrollable expert roster.
- `/privacy` policy page with editable content in `src/content/privacy-policy.ts`.
- Admin ops dashboard signup table (email, date, referrer) alongside waitlist metrics.
- Early-access Playwright E2E coverage and waitlist roster ordering helpers.

### Changed
- Desktop layout: signup on the left, Chris video sticky on the right; mobile uses full-bleed video and improved form stacking.
- Footer and signup trust line link to `/privacy` instead of mailto.
- Waitlist production allows admin ops dashboard access when signed in as admin.

### Fixed
- Merge integration with Supabase auth session/proxy while preserving waitlist admin ops paths.

## [0.4.0.1] - 2026-06-16

### Fixed
- X OAuth and other Supabase redirects no longer fall back to `http://127.0.0.1:3000` in production when `NEXT_PUBLIC_APP_URL` is unset — uses `https://astro-link.space` instead.

## [0.4.0.0] - 2026-06-16

Real account creation with Supabase Auth.

### Added
- Email/password sign-up and sign-in on `/auth`, with email confirmation and forgot/update password flows.
- Phone OTP sign-in (international `+` format) alongside email — equal entry points on the auth page.
- X (Twitter) OAuth sign-in; new OAuth users complete profile when email is missing.
- Supabase SSR session cookies with proxy refresh; demo cookie auth preserved for local dev and E2E when `ENABLE_DEMO_AUTH=true`.
- `user_app_state` table and `handle_new_auth_user` trigger linking `auth.users` to mentee profiles (`users.auth_id`, `mentors.user_id`).
- `NEXT_PUBLIC_APP_URL` for PKCE redirect URLs (production default `https://astro-link.space`).

### Changed
- `getSession()` and proxy resolve roles from Supabase `auth.users` → mentee, mentor, or admin (`ADMIN_EMAILS`).
- Expert category filtering aligned between the booking picker and `/experts` directory.

### Operations
- Production: set `ENABLE_DEMO_AUTH=false`, configure Supabase Site URL + redirect URLs, Twilio Verify for phone, and X OAuth credentials in the Supabase dashboard.

## [0.3.1.0] - 2026-06-16

Booking expert selection and signed-in home experience.

### Added
- Inline expert picker on `/booking` — horizontal carousel with category filters so mentees can choose an expert and see rates without leaving checkout.
- Mobile sticky price bar on booking showing estimated total after expert selection.
- Signed-in landing shell on `/` — welcome message, role-aware quick actions, and expert teaser for mentees (marketing hero hidden when signed in).

### Changed
- Shared expert category filter between booking picker and `/experts` directory.
- Booking header rate label uses `$X/hr` consistently; summary no longer shows pre-call brief price before an expert is picked.

## [0.3.0.2] - 2026-06-15

Mobile load-time and first-paint polish on public routes.

### Fixed
- Material icons no longer flash raw ligature names (e.g. `chat_bubble`) before fonts load on landing, experts, auth, and early-access pages.

### Changed
- Inline SVG icons for common public-route symbols with font stylesheet preloaded in the document head.
- Landing hero and expert directory load statically for faster above-fold paint; comparison section stays lazy-loaded with a skeleton.
- Root route loading shell mirrors the landing layout while data streams in.
- Capped Next.js image `deviceSizes` and tightened `sizes` / LCP `priority` on public expert grids to reduce mobile bandwidth.

## [0.3.0.1] - 2026-06-15

Platform bug-and-polish pass across public surfaces, booking, dashboards, and admin metrics.

### Fixed
- Landing expert cards now link to `/experts/[slug]` profile pages instead of dead ends.
- Mentor profile edits persist to the database and revalidate the public expert directory after save.
- Booking, session exit, and settings redirects respect the signed-in role (mentee vs mentor vs admin).
- Custom `not-found` page with navigation back to home and the expert directory.
- Removed the dead "Forgot password?" link on the auth page.
- E2E smoke test expects Chris Sembroski at **$250/hr** (matches production data).

### Changed
- Route-level loading skeletons for dashboard, booking, expert profile, and mentee settings.
- Lazy-loaded experts detail panel/sheet, Stripe payment step, and below-the-fold landing sections.
- Mentor earnings and admin waitlist metrics use fewer database round-trips (single join + 60s cache).
- AstroLink metadata title template, accessible tab/filter controls, and unified image URL helper.
- Removed the placeholder Reports tab from the mentor dashboard.
- Synced `package.json` version with `VERSION` (was stuck at 0.2.0.1 after the 0.3.0.0 release).

## [0.3.0.0] - 2026-06-13

**Real Stripe Payments + Variable Duration Live Sessions**

This is a significant release that brings production-ready payments and flexible session lengths to AstroLink.

### Added
- Real Stripe payments with immediate-capture PaymentIntents (platform-only collection at launch). We now use a dedicated AstroLink sandbox for testing/dev/preview and a scoped Restricted API Key (RAK) + live webhook for production on the shared Helios Nexus account.
- Variable-duration live 1:1 sessions controlled by a slider in the booking summary card (15-minute minimum, up to 2 hours). Pricing is prorated in real time from the mentor's hourly rate (the `live_session_price_cents` value is treated as the hourly rate). The chosen duration is persisted on the booking record.
- Full refund support via `POST /api/bookings/[id]/cancel` with a clear cancellation policy library (`src/lib/refunds.ts`).
- Per-user rate limiting on booking creation and cancellation.
- Additional Stripe webhook event handlers (`payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`) plus defensive filtering using `metadata.app = 'astrolink'` for the shared account.

### Changed
- Removed `STRIPE_BOOKING_TEST_MODE` entirely and all manual-capture/escrow paths. `SKIP_STRIPE_PAYMENTS` is now strictly for local AI/E2E testing and is hard-disabled in production.
- `pending_payment` bookings are included in the "upcoming" lists immediately (so users see their new booking right after paying). Added auto-refresh polling on the just-booked flow and friendly status labels ("Awaiting confirmation") so the transition to `confirmed` + room availability feels smooth.
- The mentor pre-session briefing (APX-02) is now always included as part of every standard live session.

### Fixed
- The "Join room" button now appears reliably once the webhook confirms the payment and provisions the Daily room. Previously, users could succeed on the client side but remain stuck in `pending_payment` with no join affordance.
- Production payments no longer require mentor Stripe Connect setup (deferred to a future phase). The platform collects 100% at launch while still recording the 80/20 split for future manual or automated payouts.
- Various races and edge cases around very close-to-call bookings, manual test data cleanup, and webhook idempotency.

### Documentation & Operations
- New guide: `docs/how-to/stripe-production-cutover.md` — exact steps for moving from the AstroLink sandbox (test keys) to production (RAK + live webhook on the same account).
- Updated `.env.example`, `AGENTS.md`, and references with clear sandbox-vs-production guidance and strong warnings against mixing live keys into preview or local environments.

## [0.2.0.1] - 2026-06-12

### Fixed

- Waitlist production (demo auth off): session cookies no longer unlock booking or dashboard APIs — behavior matches the public landing gate via `getSession()`.
- Production checkout always requires mentor Connect setup and enforces the 20% platform fee split; `STRIPE_BOOKING_TEST_MODE` cannot bypass either.
- Bookings fail fast when the matching engine picks an expert outside the approved pool, with a clear error instead of an opaque lookup failure.

## [0.2.0.0] - 2026-06-11

### Added

- Bidirectional live captions during calls: each participant sees the other’s speech in their own language (Daily `multi` + `nova-3`, speaker resolution, per-viewer translate direction).
- Translation queue with in-flight cap, dropped-queue finalization as raw text, and a paused banner when rate limits or token budget are hit (auto-resume when the window clears).
- Post-call transcript panel with batch translation API (`GET/POST /api/session/[bookingId]/transcript`) and localized recap toggle.
- Session join-url helper API and `daily-join-url` lib for secure room entry.
- Dedicated `caption` LLM rate-limit scope (`LLM_MAX_CAPTION_*` in `.env.example`).

### Changed

- Caption rail sits below the video band; `use-daily-call` guards duplicate `startTranscription` on rejoin.
- `translate-segment` returns structured `rate_limited` / `budget_exceeded` codes; `callLlmWithBackoff` preserves `LlmRateLimitError` type for correct HTTP mapping.

### Fixed

- Persistent red "Translation unavailable" badge when mentor speech triggered shared mentee rate limits (graceful fallback + separate caption budget).
- Translation queue slot leak on duplicate `speech_id` handoff.

## [0.1.6.1] - 2026-06-10

### Fixed

- Mobile expert detail bottom sheet: long bios and the primary "Book" CTA were clipped / unreachable after slide-up (the sheet used `max-h-[92vh] overflow-hidden` with no dedicated outer scroller and an internal bio cap). Restructured `ExpertDetailContent` (sheet variant) to a `min-h-0 flex-1 overflow-y-auto` content region + docked `ExpertDetailActions` footer with `pb-[max(2rem,env(safe-area-inset-bottom))]`. Switched sheet to `max-h-[92dvh]` and removed the sheet-variant height cap from `ExpertBioPreview`. Added E2E regression assertion that the book button is visible after the sheet opens.

## [0.1.6.0] - 2026-06-09

### Added

- Browse the full mentor roster at `/experts`: category filters, visual cards, and inline preview (desktop modal with blurred backdrop, mobile bottom sheet). The landing page shows a six-card teaser with “View all experts.”
- Shared `getExpertBookHref` helper and `expert-bio` preview utilities (truncation + Read more for long bios); unit tests and `e2e/experts-directory.spec.ts`.

### Changed

- `ExpertIntroMedia` supports `autoPlayMuted` for directory preview context.
- Profile, booking, and not-found flows link back to `/experts` instead of `/#directory`.

## [0.1.5.0] - 2026-06-09

### Added

- You can now read expert speech in your language during a live call: custom Daily `createCallObject()` UI, mobile-first caption rail, and mentor “Captions on for buyer” when the mentee’s `preferred_locale` differs from English. Enable `DAILY_TRANSCRIPTION_ENABLED=true` locally; see [video session demo](./docs/how-to/video-session-demo.md#live-captions-demo-d3-phase-3).
- `POST /api/session/[bookingId]/translate-segment` — per-utterance APX-06 translation with server-enforced target locale, per-booking LRU segment cache, token budget guards, and `SEGMENT_TRANSLATED` audit events.
- `use-live-captions` hook wires Daily `transcription-message` events to the translate API with client-side cache, abort/stale-sequence handling, and English fallback on error.
- Unit tests for segment cache, translate-segment, daily transcription helpers, and translate-segment API route; E2E `live-captions.spec.ts` with stubbed LLM.

### Changed

- Session room uses `DailyCallRoom` with participant video tiles and call controls; transcription starts on owner join when `DAILY_TRANSCRIPTION_ENABLED=true`.
- `booking-access` exposes mentee locale and caption flags for the session shell; centralized `isE2eStubLlmEnabled()` in `llm.ts` for E2E translation stubs.
- `TranslationAgent.translateSegment()` delegates to shared `translateSegment()` lib; roadmap marks Phase 3 shipped.

## [0.1.4.2] - 2026-06-09

### Added

- Public expert profile pages (`/experts/[slug]`): you can now browse the verified directory on the landing and click through to rich individual profiles. Each profile features a prominent intro video (graceful portrait fallback), full bio, expertise as pills, a modalities teaser matching the hero promise (Live 1:1 active + priced), trust signals, and CTAs that feed the existing booking flow. Landing cards now deep-link expert names to profiles (book buttons remain the fast path).
- Landing page directory cards now deep-link expert **names** to their profile pages while preserving the "Book session" fast-path button.
- `ListedExpert` interface and `mentorToListedExpert` mapper now expose `introVideoUrl` (sourced from the existing `mentors.intro_video_url` column) for rich profile media.
- New reusable `ExpertIntroMedia` component for consistent hero video/image treatment on profiles.
- Dedicated route group with server-side data fetching (`getMentorBySlug`), dynamic metadata, and friendly not-found page.

### Changed

- Small updates to `src/app/landing-page-client.tsx` and `src/lib/mentor-directory.ts` to wire profile links and surface the new video field (additive, fully backward compatible).

## [0.1.4.1] - 2026-06-08

### Fixed

- Post-ship eng review: Zod validation for recap `summary_json` (rejects partial or malformed shapes).
- Session room recap polling stops when recap is ready and translation is not pending.
- `RECAP_TRANSLATION_FAILED` audit path covered by unit test.

## [0.1.4.0] - 2026-06-07

### Added

- D3 Phase 2 localized post-session recap: `session_translations` table, APX-06 translation agent, mentee `preferred_locale` on profile, and recap API `locale` / `translationPending` / `translationFailed` fields.
- Mentee settings dropdown for recap language (en, es, pt-BR, fr, ja).
- Session room recap polling for translated content; E2E `localized-recap.spec.ts` (D13) with stubbed LLM recap + translation.
- Unit tests for recap locale resolution, translation agent, user profile locale, and extended recap/post-session coverage.

### Changed

- Post-session fulfillment runs APX-06 after English synthesis when mentee locale differs; idempotent retry when booking already completed without a session row.
- Dev `simulate_meeting_ended` fulfills by booking ID (no Daily room required); session synthesis skip only when valid `summary_json` exists.
- Playwright webServer pins `DAILY_TRANSCRIPTION_ENABLED=false` so E2E synthesis runs on meeting end.

### Fixed

- E2E parallel cleanup uses spec-specific `E2E:` tags to avoid cross-spec booking deletion.
- Golden path briefing assertion scoped to sidebar (strict mode).
- Zod v4 enum validation on mentee settings `preferredLocale`.

## [0.1.3.0] - 2026-06-06

### Added

- D3 Phase 1 post-session transcript pipeline: Daily WebVTT fetch/parse, `session_transcripts` table with participant RLS, dual-trigger synthesis gate (`meeting.ended` + `transcript.ready`), and `transcript.error` fallback to APX-03 synthesis.
- `GET /api/session/[bookingId]/recap` for booking participants; session room recap panel polls until recap is ready.
- Unit tests for post-session gate, persist, Daily webhook routing, and recap access.

### Changed

- Post-session fulfillment split into persist vs synthesis paths with idempotent inserts (`23505` handling).
- Dev session-operator supports `simulate_transcript_ready` / `simulate_transcript_error` for local dogfooding.

## [0.1.2.1] - 2026-06-04

### Added

- `npm run dev:lan` for HTTPS dev on LAN (camera/mic on phones during dual-device video demos).
- `src/lib/media-origin.ts` and `src/lib/format.ts` with unit tests.
- `allowedDevOrigins` in `next.config.ts` for LAN HMR; `certificates/` gitignored.

### Changed

- Mentee/mentor dashboards and session room use shared session time formatting.
- Video session how-tos updated for LAN HTTPS workflow.

### Fixed

- Session room infinite re-render from uncached `useSyncExternalStore` media-origin snapshot (React 19).

## [0.1.2.0] - 2026-06-04

### Added

- Demo mentor seed (`carlos-hernandez`, `carlosphernandez2020@gmail.com`) for dual-device live video walkthroughs.
- `DEMO_MENTOR_PRESET` in `auth-presets` so demo login maps to the new mentor row.
- Unit tests for demo mentor preset resolution.
- How-to runbook: `docs/how-to/demo-dual-device-video.md`.

## [0.1.1.0] - 2026-06-04

### Added

- `APP_MODE=waitlist` with `ENABLE_DEMO_AUTH` and optional `ADMIN_EMAILS` for production waitlist vs ops preview access.
- IP rate limiting on `POST /api/early-access` (configurable via env).
- Shared `auth-presets` module for dev/E2E seed logins.

### Changed

- Admin dashboard shows live early-access waitlist metrics only (removed mock telemetry, compliance queue, and marketplace stats).
- Auth page no longer shows simulation flight presets; login/register blocked when demo auth is off.
- Mentor dashboard uses `requireRole('mentor')`, empty profile when no DB row, and no mock reports telemetry.
- Production requires `ENCRYPTION_KEY`; proxy redirects protected routes to `/early-access` in waitlist mode without demo auth.
- E2E uses session bootstrap instead of preset buttons; Playwright sets `APP_MODE=full` and `ENABLE_DEMO_AUTH=true`.

### Fixed

- Prevents mock cookie sessions from granting public access to dashboards when running waitlist-only production.

## [0.1.0.1] - 2026-06-04

### Added

- Marketing `?ref=` capture on early-access signup so campaign links attribute signups to a referrer.
- Admin-only waitlist metrics API and dashboard card (total signups, 7-day trend, week-over-week, top referrers).
- Team ops docs: weekly Slack brief template and marketing referrer taxonomy.

### Changed

- Early-access client sends parsed referrer with each signup request.
