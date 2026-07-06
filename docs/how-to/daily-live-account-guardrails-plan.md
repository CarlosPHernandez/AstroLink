# Daily live account guardrails plan

**Status:** plan for review; not implemented yet
**Date:** 2026-06-03
**Branch:** `cursor/video-call-daily-plan-70d4`

AstroLink now has a funded Daily.co account with roughly 10,000 included
participant-minutes. This plan keeps the Chris/customer video demo reliable while
making it difficult for local tests, refresh loops, stale rooms, or long calls to
consume the account unexpectedly.

Daily bills by **participant-minute**, not wall-clock meeting minute. A
15-minute two-person demo is about 30 participant-minutes. A 30-minute
two-person session is about 60 participant-minutes.

## Current implementation snapshot

| Area | Current behavior | Files |
|------|------------------|-------|
| Room provisioning | After payment or skip-Stripe fulfillment, a private Daily room is created if `DAILY_API_KEY` exists and `daily_room_url` is empty. | `src/lib/post-payment.ts`, `src/lib/daily.ts` |
| Room identity | Room name is deterministic from booking ID; room URL is saved on `bookings.daily_room_url`. | `src/lib/daily.ts` |
| Join authorization | Only the mentee, mentor, or admin can open `/session/[bookingId]`; the server mints a Daily meeting token only when the participant joins. | `src/lib/booking-access.ts`, `src/app/api/session/[bookingId]/join-url/route.ts` |
| Daily room settings | Private room, chat enabled, video/audio on, 48h default expiry or scheduled time + 4h. | `src/lib/daily.ts` |
| Completion | Daily `meeting.ended` webhook drives APX-03 recap, Stripe capture, and `completed` status. | `src/app/api/webhooks/daily/route.ts`, `src/lib/post-session.ts` |
| Existing quota pattern | LLM calls use an env-driven in-memory rate limiter. | `src/lib/llm-rate-limit.ts` |
| Demo runbook | Chris/Carlos demo flow exists, but does not yet include Daily account spend controls. | `docs/how-to/video-session-demo.md` |

## Goals

1. Keep the live Daily key out of local/CI by default.
2. Prevent unbounded room creation when a live key is configured.
3. Limit participant count and call length for demo rooms.
4. Mint join tokens only during an intended session window.
5. Track used and reserved participant-minutes against a conservative budget.
6. Preserve the existing D1 user flow: booking -> room -> `/session/[id]` ->
   Daily webhook -> recap/capture.

## Non-goals for this review pass

- No custom Daily Prebuilt replacement.
- No recordings or transcripts.
- No HIPAA/compliance claim changes.
- No implementation until the plan is approved.

## Phase 0 - Live account setup before any code changes

1. **Environment placement**
   - Store `DAILY_API_KEY` and `DAILY_WEBHOOK_HMAC` only in the intended
     deployed demo/staging environment.
   - Do not inject the live Daily key into Playwright, CI, or shared local
     agent environments.
   - If the key was ever pasted into a chat, log, or committed file, rotate it
     before the customer demo.

2. **Webhook verification**
   - Configure Daily to send only `meeting.ended` to:
     `https://astro-link-sooty.vercel.app/api/webhooks/daily`.
   - Demo/staging host: [astro-link-sooty.vercel.app](https://astro-link-sooty.vercel.app).
   - Send a Daily dashboard test webhook or complete one short dry-run call.
   - Confirm the app accepts the HMAC and logs a successful completion path.

3. **Dashboard budget routine**
   - Record the Daily usage number before rehearsal and before the real demo.
   - Treat 8,000 participant-minutes as the internal warning level and 9,000 as
     the hard stop until exact automated enforcement is shipped.
   - Review active rooms after any rehearsal. Delete stale rooms from Daily
     manually if they are no longer needed.

4. **Demo environment policy**
   - Use one dedicated demo/staging environment for the live key.
   - Keep local `.env.local` Daily-free unless a developer is intentionally
     testing a real call.
   - Prefer `E2E_STUB_LLM=true` and no `DAILY_API_KEY` for E2E. The golden path
     should be allowed to stop at "room preparing" or token error when Daily is
     intentionally disabled.

## Phase 1 - Minimum code guardrails before a Chris/customer demo

### 1. Add a Daily provisioning feature flag

Introduce an env-driven helper, similar to `isStripePaymentsSkipped()` and
`assertLlmRateLimit()`:

```txt
DAILY_PROVISION_ENABLED=false
```

Behavior:

- If `false`, do not call Daily room creation from post-payment, manual
  provision, or dev operator routes.
- If `true`, require `DAILY_API_KEY` and allow the existing provision flow.
- In production/demo, fail closed if the flag is absent. In local development,
  allow Daily to remain absent without failing booking.

Touch points:

- `src/lib/daily.ts`
- `src/lib/post-payment.ts`
- `src/app/api/session/provision/route.ts`
- `src/app/api/dev/session-operator/route.ts`
- `.env.example`
- `docs/how-to/video-session-demo.md`

### 2. Tighten Daily room properties for demo rooms

Use Daily room/token controls to restrict each booked room:

```txt
DAILY_MAX_PARTICIPANTS=2
DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES=15
DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES=60
DAILY_MAX_CALL_MINUTES=35
```

Room creation should set:

- `privacy: "private"`
- `max_participants: 2`
- `enforce_unique_user_ids: true`
- `eject_at_room_exp: true`
- `eject_after_elapsed: DAILY_MAX_CALL_MINUTES * 60`
- `exp`: scheduled time + join-window-after, instead of 48h / +4h for demo mode

Meeting token creation should set:

- `room_name`
- `user_id`
- `user_name`
- `is_owner` only for mentor/admin
- `nbf`: scheduled time - join-window-before
- `exp`: scheduled time + join-window-after
- `eject_at_token_exp: true`
- `eject_after_elapsed: DAILY_MAX_CALL_MINUTES * 60`

This protects against link reuse, forgotten tabs, excessive refreshes, and more
than two participants joining a Chris/customer demo.

### 3. Enforce the join window in AstroLink before minting a token

Update `getBookingForSession()` so a confirmed booking with a room URL is not
automatically token-ready at all times.

Suggested gates:

- `too_early`: before `scheduled_at - 15 minutes`
- `ready`: from `scheduled_at - 15 minutes` through `scheduled_at + 60 minutes`
- `expired`: after `scheduled_at + 60 minutes`

The page should show a clear message instead of creating a Daily token outside
the allowed window.

### 4. Rate limit Daily API calls (deferred from Phase 1)

**Eng review decision (2026-06-04):** Defer app-level Daily API rate limits to Phase 2.
In-memory limits (same pattern as `llm-rate-limit.ts`) are not globally enforced on
Vercel multi-instance deployments. Phase 1 relies on Daily room/token properties and
`DAILY_PROVISION_ENABLED` instead.

When the usage ledger ships in Phase 2, add Supabase-backed counters (not in-memory
Maps) with these initial limits:

| Operation | Scope | Suggested limit |
|-----------|-------|-----------------|
| Room provision | global | 20/hour |
| Room provision | booking | 2/hour |
| Meeting token mint | booking + user | 10/hour |
| Meeting token mint | global | 120/hour |

## Phase 2 - Participant-minute budget enforcement

### 1. Add a usage ledger

Create a small table, for example `daily_usage_events`:

| Column | Purpose |
|--------|---------|
| `id` | Primary key |
| `booking_id` | AstroLink booking |
| `daily_room_name` | Daily room |
| `daily_meeting_id` | Daily meeting ID when present |
| `duration_seconds` | Meeting wall-clock duration |
| `participant_count` | Exact count if fetched from Daily, otherwise conservative estimate |
| `participant_minutes` | Budget unit used for caps |
| `source` | `webhook`, `daily_api_reconcile`, or `manual_adjustment` |
| `created_at` | Audit timestamp |

The existing webhook already receives `start_ts`, `end_ts`, and sometimes
`meeting_id`. Until exact participant counts are fetched from Daily, use a
conservative estimate:

```txt
participant_minutes = ceil(duration_seconds / 60) * DAILY_MAX_PARTICIPANTS
```

### 2. Reserve minutes before creating a room

Before `provisionDailyRoomForBooking()` calls Daily:

1. Sum current-month `daily_usage_events.participant_minutes`.
2. Add outstanding reservations for confirmed, not-completed bookings that
   already have rooms.
3. Reserve the next booking as:
   `DAILY_MAX_PARTICIPANTS * DAILY_MAX_CALL_MINUTES`.
4. If the total would exceed the hard stop, do not create a room.

Recommended defaults:

```txt
DAILY_MONTHLY_PARTICIPANT_MINUTE_BUDGET=10000
DAILY_MONTHLY_WARNING_PARTICIPANT_MINUTES=8000
DAILY_MONTHLY_HARD_STOP_PARTICIPANT_MINUTES=9000
DAILY_ALLOW_ADMIN_BUDGET_OVERRIDE=false
```

The hard stop is intentionally below 10,000 to leave room for Daily dashboard
rounding, delayed webhook delivery, retries, and manual testing.

### 3. Add exact usage reconciliation

After the initial ledger ships, add a reconciliation command or scheduled job
that uses Daily's meeting/log APIs to replace conservative estimates with exact
participant-minute data when available.

This is the point where the product can safely move from "demo protected" to
"repeatable live-account operations."

## Phase 3 - Room cleanup and missed-webhook recovery

1. Delete or expire the Daily room after a completed/cancelled booking.
2. Add an admin-only reconciliation endpoint for confirmed bookings whose room
   expiry has passed but no `meeting.ended` webhook arrived.
3. Keep the existing dev-only `simulate_meeting_ended` fallback for non-prod,
   but never expose it in production.
4. Add an operator dashboard summary:
   - current-month Daily participant-minutes
   - reserved participant-minutes
   - active room count
   - bookings blocked by Daily budget

## Chris/customer demo playbook

1. **T-24h dry run**
   - Confirm `DAILY_PROVISION_ENABLED=true` only in the demo environment.
   - Confirm `DAILY_MAX_PARTICIPANTS=2`.
   - Confirm Daily webhook HMAC succeeds.
   - Record starting Daily participant-minute usage.

2. **T-1h preflight**
   - Create or identify one booking for Carlos -> Chris.
   - Open `/session/[bookingId]` as Carlos and Chris in separate browser
     profiles.
   - Join briefly, hang up inside Daily, and confirm completion/recap.
   - Record the usage delta.

3. **Customer demo**
   - Use one booking.
   - Keep the live call under 15 minutes.
   - Avoid additional rehearsal rooms once the customer is present.
   - Hang up inside Daily, not only via the AstroLink header button.

4. **Post-demo**
   - Confirm booking is `completed`.
   - Confirm recap appears.
   - Confirm Daily usage delta is roughly expected.
   - Delete any stale Daily rooms from the dashboard until automated cleanup
     ships.

## External-service verification checklist

Follow this before blaming application code:

- Daily account has billing/funds enabled and API access active.
- `DAILY_API_KEY` is valid in the deployed environment only.
- `DAILY_WEBHOOK_HMAC` matches the Daily dashboard secret.
- Daily webhook URL is reachable from the public internet.
- Daily webhook event includes `meeting.ended`.
- Daily dashboard shows expected session and participant-minute usage.
- Vercel/Supabase env vars are present in the same environment that runs the
  demo.
- Browser console has no camera/microphone permission failure.
- The app can call Daily REST APIs from the server environment.

## Gstack / CEO-hours review pass

I searched the repository for a named `Gstack`, `G-Stack`, or `CEO hours`
workflow/script and did not find one. This section captures the manual review
against a CEO/customer-demo lens.

| Question | Review result |
|----------|---------------|
| Can one bad loop consume the Daily account? | Phase 1 tightens room/token TTL and join windows; Phase 2 adds hard budget enforcement. App API rate limits deferred to Phase 2 (Vercel in-memory limits are not global). |
| Can a random user join the demo? | Existing participant auth + Daily private rooms already protect access; token join windows make this tighter. |
| Can a legitimate participant get blocked during the demo? | Risk exists if join windows are too narrow. Use a 15-minute early / 60-minute late window for the first demo. |
| Can we explain spend clearly? | Yes: "Daily bills participant-minutes; a 15-minute two-person demo is about 30 minutes of usage." |
| What is the biggest remaining operational risk? | Missing webhook or stale room cleanup. Phase 3 handles this; until then, use the runbook and Daily dashboard. |
| What must ship before a customer demo? | Phase 1 is the minimum. Phase 2 should ship before repeated demos or production traffic. |

## Approval recommendation

Approve **Phase 1** for immediate implementation before any Chris/customer demo.
Approve **Phase 2** before repeated live-account usage. Defer **Phase 3** until
after the first live demo unless stale rooms or missed webhooks show up during
rehearsal.

## Eng review amendments (2026-06-04)

Decisions from `/plan-eng-review`:

1. **Defer `daily-rate-limit.ts` from Phase 1.** In-memory limits (same pattern as
   `llm-rate-limit.ts`) are not globally enforced on Vercel multi-instance
   deployments. Phase 1 protection comes from `DAILY_PROVISION_ENABLED`, Daily room
   props (`max_participants`, `eject_after_elapsed`, `eject_at_room_exp`), and
   meeting-token `nbf`/`exp`. Revisit Supabase-backed counters with the Phase 2
   usage ledger.
2. **Keep join-window gates in Phase 1.** Extend `SessionGate` with `too_early` and
   `expired`; mirror the same window in Daily token properties.
3. **Pin webhook URL** to production demo host:
   `https://astro-link-sooty.vercel.app/api/webhooks/daily`.
4. **Force E2E Daily-free:** add `DAILY_API_KEY: ''` (or unset) to
   `playwright.config.ts` `webServer.env` so CI never provisions real rooms.

## What already exists

| Capability | Location | Plan reuse |
|------------|----------|------------|
| Room provision on payment | `post-payment.ts` | Extend with `DAILY_PROVISION_ENABLED` gate |
| Daily REST + HMAC webhook | `src/lib/daily.ts`, `webhooks/daily/route.ts` | Extend room/token props; no rewrite |
| Session auth + token mint | `booking-access.ts` | Add join-window gates + pass scheduled_at into token |
| LLM rate-limit pattern | `llm-rate-limit.ts` | Reference only; defer Daily API rate limits to Phase 2 |
| Dev simulate `meeting.ended` | `api/dev/session-operator/route.ts` | Keep non-prod only |
| E2E tolerant session states | `e2e/golden-path.spec.ts` | Already accepts provisioning/token-error; strip Daily key in webServer |

## NOT in scope (explicit deferrals)

| Item | Rationale |
|------|-----------|
| App-level Daily API rate limits (Phase 1) | Vercel in-memory limits are per-instance; defer to Phase 2 ledger |
| Exact participant-count reconciliation | Phase 2; conservative estimates sufficient for first demo |
| Automated room deletion | Phase 3; manual Daily dashboard cleanup until then |
| Admin budget override UI | Phase 2; env flag only initially |
| Custom Daily Prebuilt | Listed in non-goals |

## Failure modes (production)

| Failure | Test? | Handling? | User sees |
|---------|-------|-----------|-----------|
| Webhook HMAC mismatch | `daily.test.ts` | 401 response | Booking stuck `confirmed` — **critical gap** until Phase 3 reconcile |
| Refresh loop mints tokens | None | 4h token TTL today | Silent API spend — **Phase 1 fixes** via token `nbf`/`exp` + join gates |
| Provision with key in local E2E | Partial E2E | No key strip in webServer | Accidental room creation — **fix playwright env** |
| Budget race (two provisions) | N/A Phase 2 | No transaction | Both rooms created — **Phase 2 needs row lock or serializable tx** |
| Join 5 min before window | None planned | Gate blocks mint | Clear `too_early` message — **Phase 1** |

## Implementation Tasks

Synthesized from eng review. Run with Claude Code; checkbox as you ship.

- [ ] **T1 (P1, human: ~1h / CC: ~15min)** — `DAILY_PROVISION_ENABLED` feature flag
  - Surfaced by: Architecture — ungated provision when `DAILY_API_KEY` set (`post-payment.ts:40,94`)
  - Files: `src/lib/daily.ts`, `post-payment.ts`, `api/session/provision/route.ts`, `api/dev/session-operator/route.ts`, `.env.example`
  - Verify: unit tests + booking without key locally still confirms
- [ ] **T2 (P1, human: ~2h / CC: ~20min)** — Demo room + token properties
  - Surfaced by: Architecture — 48h room TTL, no max participants (`daily.ts:16-18,84-92`)
  - Files: `src/lib/daily.ts`, `.env.example`
  - Verify: `npm test` daily.test.ts + manual room inspect in Daily dashboard
- [ ] **T3 (P1, human: ~2h / CC: ~25min)** — Join window gates (`too_early` / `expired`)
  - Surfaced by: Architecture — gate always `ready` when confirmed + URL (`booking-access.ts:49-61`)
  - Files: `booking-access.ts`, `session-room-client.tsx`, new `booking-access.test.ts`
  - Verify: unit tests for window boundaries; UI shows messages not iframe
- [ ] **T4 (P1, human: ~15min / CC: ~5min)** — E2E Daily-free webServer env
  - Surfaced by: Test review — playwright inherits `.env.local` Daily key
  - Files: `playwright.config.ts`
  - Verify: `npm run test:e2e` never calls Daily REST
- [ ] **T5 (P2, human: ~4h / CC: ~45min)** — `daily_usage_events` ledger + budget gate
  - Surfaced by: Phase 2 plan + budget race concern
  - Files: new migration, `src/lib/daily-usage.ts`, `post-payment.ts`, webhook handler
  - Verify: unit tests for reserve/hard-stop; migration applied on Supabase project
- [ ] **T6 (P3, human: ~3h / CC: ~30min)** — Missed-webhook reconciliation endpoint
  - Surfaced by: Failure modes — stuck `confirmed` after call
  - Files: `api/admin/daily-reconcile/route.ts` (or extend session-operator pattern)

## Parallelization

| Step | Modules | Depends on |
|------|---------|------------|
| T1 feature flag | `daily.ts`, `post-payment.ts`, API routes | — |
| T2 room/token props | `daily.ts` | T1 (shared env helpers) |
| T3 join gates | `booking-access.ts`, session UI | T2 (token nbf/exp helpers) |
| T4 E2E env | `playwright.config.ts` | — |

**Lanes:** Launch T1+T4 in parallel. Then T2 → T3 sequential. Phase 2 (T5) after Phase 1 merges.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | Manual CEO-hours table in plan only |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | Not run (user skipped outside voice) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open | 6 issues, 2 critical gaps, scope amended |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | Join-window UI only (minimal) |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **UNRESOLVED:** 0 (rate-limit store + join-window phase decided)
- **VERDICT:** ENG REVIEW COMPLETE WITH AMENDMENTS — Phase 1 ready to implement after plan updates applied; eng review required before ship remains satisfied for this plan pass
