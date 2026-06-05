# Changelog

All notable changes to AstroLink are documented in this file.

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
