# Changelog

All notable changes to AstroLink are documented in this file.

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
