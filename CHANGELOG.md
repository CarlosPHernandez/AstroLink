# Changelog

All notable changes to AstroLink are documented in this file.

## [0.1.4.2] - 2026-06-09

### Added

- Public expert profile pages (`/experts/[slug]`): redesigned premium layout featuring prominent intro video (with graceful portrait fallback), full bio, all expertise tags as pills, "How to work with [Expert]" modalities section (echoing the landing hero's three modalities, with live 1:1 active and priced), trust signals, and multiple CTAs that feed the existing booking flow (`/booking?mentor=slug`).
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
