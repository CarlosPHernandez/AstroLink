# Plan: Paid-call Daily transcript reliability

**Status:** IMPLEMENTING on `fix/daily-transcript-reliability-hardening`  
**Date:** 2026-07-22  
**Branch:** `fix/daily-transcript-reliability-hardening`  
**Incident:** `docs/explanation/daily-transcription-storage-incident.md`  
**Preflight runbook:** `docs/how-to/daily-transcription-storage-preflight.md`

## Problem

First paid Chris call: live captions worked; Daily showed `t_finished`; **no** downloadable WebVTT; **zero** `session_transcripts` rows. Root cause documented: domain `enable_transcription_storage` was false. Enabling storage later does not backfill.

Additional production gaps confirmed in eng review:

1. **`DAILY_WEBHOOK_HMAC` is empty** — `POST /api/webhooks/daily` returns **500** immediately (`src/app/api/webhooks/daily/route.ts`). Webhook-driven transcript ingest cannot succeed until the secret is set.
2. **No post-fix rehearsal** proving a non-empty `session_transcripts` row (product promise → hard go/no-go).
3. Room create does not set `enable_transcription_storage` (domain-only is fragile).
4. No production admin reclaim when webhook misses but Daily still has a VTT.
5. Webhook awaits LLM synthesis before 200 — risk of FAILED webhook after durable work.

## Goal

Smallest reliable fix that protects the **next paid call**: working webhooks + stored VTT path + recovery + proof. Not a rewrite. Not UI polish.

## Locked decisions (eng review)

| ID | Decision | Choice |
|----|----------|--------|
| D1 | Scope | **A** Ops + code minimum (HMAC, room storage prop, durable-first webhook, admin reclaim, hard rehearsal gate) |
| D2 | HMAC | **A** Recover/recreate Daily webhook; set `DAILY_WEBHOOK_HMAC`; verification always required |
| D3 | Room storage | **A** Set `enable_transcription_storage: true` on `createDailyRoomForBooking` |
| D4 | Reclaim | **A** Admin-only reclaim API with real Daily fetch |
| D5 | Webhook semantics | **A** Durable-first: 500 until persist; after persist synthesis failure → 200 + audit |
| D6 | Rehearsal | **A** Hard go/no-go: no next paid call until access-link + `session_transcripts` proven |
| D7 | Reclaim input | **A** Explicit `transcriptId` required (no auto-pick) |
| D8 | Tests | **A** Vitest for code + mandatory manual preflight (no live Daily in CI) |
| DD1 | Design scope | **A** Honesty-only (state table + copy; no mockups; no admin UI) |
| DD2 | Missing-transcript copy | **A** Processing → delayed → unavailable (time-phased) |

## What already exists (reuse)

| Piece | Location | Plan uses it? |
|-------|----------|----------------|
| Room provision | `src/lib/daily.ts` `createDailyRoomForBooking` / `provisionDailyRoomForBooking` | Yes — add storage property |
| HMAC verify | `verifyDailyWebhookSignature` | Yes — ops supplies secret; no auth redesign |
| Webhook route | `src/app/api/webhooks/daily/route.ts` | Yes — durable-first error split |
| Transcript ready fulfill | `fulfillBookingAfterTranscriptReady` | Yes — reclaim + webhook |
| VTT fetch | `fetchDailyTranscriptVtt` | Yes |
| Persist | `persistSessionTranscript` | Yes |
| Complete-on-leave fallback | `POST /api/session/[bookingId]/complete` | Keep (booking status only; not transcript success) |
| Dev operator | `POST /api/dev/session-operator` | Dev-only sample VTT; **not** production reclaim |
| Admin auth | `requireApiRole('admin')` in `src/lib/api-auth.ts` | Yes — reclaim route |
| Preflight docs | `docs/how-to/daily-transcription-storage-preflight.md` | Yes — hard gate |

## Architecture

### Target flow

```
Payment confirm
    → provisionDailyRoomForBooking
    → Daily room with enable_transcription_storage:true  [NEW]
    → mentor join startTranscription (DAILY_TRANSCRIPTION_ENABLED)
    → hang-up
         ├─ leave → POST .../complete → booking completed
         └─ Daily webhooks (HMAC required)
              ├─ meeting.ended → complete + gate wait for transcript
              └─ transcript.ready-to-download
                    → fetch access-link VTT
                    → session_transcripts          [DURABLE]
                    → APX-03 synthesis             [best-effort after durable]
                         fail → audit, still 200

Miss path:
  Admin POST reclaim { transcriptId }
    → same fetch/persist/gate as webhook
```

### HMAC ops (blocking, no code)

Daily always returns a base64 `hmac` when a webhook is **created** (`POST /v1/webhooks`). You can also `GET /v1/webhooks` / `GET /v1/webhooks/:uuid` for the secret. This is **not** a separate dashboard “toggle” — if the secret was never copied into Vercel, our handler correctly rejects all events with 500.

**Ops steps:**

1. List webhooks: `GET https://api.daily.co/v1/webhooks` with `DAILY_API_KEY`.
2. If webhook exists for `https://<prod-host>/api/webhooks/daily`:
   - Copy `hmac` into Vercel Production `DAILY_WEBHOOK_HMAC`.
   - Confirm `eventTypes` includes `meeting.ended`, `transcript.ready-to-download`, `transcript.error`.
   - If `state` is `FAILED`, reactivate via Daily’s update/re-POST flow after env is fixed (endpoint must return 200 to test probe).
3. If missing/wrong URL: create webhook with those event types; save returned `hmac` immediately.
4. Prefer `retryType: exponential` if recreating (message-level retries; less global circuit-break) — optional, document if set.
5. Redeploy or env-refresh so production process sees the secret.
6. Smoke: send Daily test or short call; confirm Vercel logs show 200 (not 500 “not configured”).

**Do not** disable signature verification in production.

### Data model

No schema migration in this plan.

- Success: `session_transcripts` row with non-empty `utterances_json` / `vtt_text`, optional `daily_transcript_id`.
- Failure observability: `audit_log` events (reclaim, synthesis-after-persist failure).
- Deferred: status columns, webhook event idempotency table (see NOT in scope).

### Admin reclaim (best practice)

- **Route:** `POST /api/admin/bookings/[id]/reclaim-transcript`
- **Auth:** `requireApiRole('admin')`
- **Body:** `{ "transcriptId": "<Daily transcript id>" }` (required)
- **Behavior:**
  1. Load booking; require `daily_room_url`.
  2. Extract room name; build `TranscriptReadyPayload`.
  3. Call `fulfillBookingAfterTranscriptReady` (same as webhook).
  4. `audit_log`: agent/event e.g. `TRANSCRIPT_RECLAIM`, ref_id = bookingId, payload `{ transcriptId, adminUserId, result }`.
- **Success:** non-empty persist or already stored.
- **Failure:** surface access-link errors honestly (not-stored remains unrecoverable).

## Implementation tasks

### Phase 0 — Ops (before trusting code)

| Step | Action | Done when |
|------|--------|-----------|
| 0.1 | Confirm domain `enable_transcription_storage=true` via `GET /v1/` | prints true |
| 0.2 | Recover/create webhook + set `DAILY_WEBHOOK_HMAC` in Vercel Production | env present; no 500 for missing secret |
| 0.3 | Confirm `DAILY_TRANSCRIPTION_ENABLED=true`, `DAILY_API_KEY`, `DAILY_PROVISION_ENABLED=true` | env checklist |

### Phase 1 — Code

| Step | Goal | Files | Behavior |
|------|------|-------|----------|
| 1.1 | Room storage prop | `src/lib/daily.ts`, `src/lib/daily.test.ts` | `properties.enable_transcription_storage: true` on create |
| 1.2 | Durable-first fulfill | `src/lib/post-session.ts`, `src/lib/post-session.test.ts` | After successful persist, wrap `maybeRunSynthesisGate` so errors are logged/audit and do not throw; fetch/persist errors still throw |
| 1.3 | Admin reclaim | `src/app/api/admin/bookings/[id]/reclaim-transcript/route.ts` + `route.test.ts` | As above |
| 1.4 | Docs pointer | Optional short section in preflight: HMAC recovery curls | Link Daily create-webhook response `hmac` field |
| 1.5 | Honesty UI (design) | `session-transcript-panel.tsx` (+ thin test if present) | Time-phased copy + light poll; see Design section |

### Phase 2 — Hard go/no-go rehearsal

Run `docs/how-to/daily-transcription-storage-preflight.md` against **production Daily domain** (or identical):

1. Rehearsal booking → join → speak ≥1 min → hang up cleanly.
2. Webhook logs 200 for `transcript.ready-to-download` (or reclaim if testing reclaim only).
3. access-link returns WebVTT with speech.
4. `session_transcripts` non-empty for that booking.
5. Transcript panel shows lines on completed session.

**Stop:** Do **not** run next paid call until all five pass.

## Test coverage (planned)

```
CODE PATHS
[+] src/lib/daily.ts
  └── createDailyRoomForBooking
      └── [GAP→TEST] body includes enable_transcription_storage:true

[+] src/lib/post-session.ts
  └── fulfillBookingAfterTranscriptReady
      ├── [★★★ exists] skip fetch when utterances stored
      ├── [★★★ exists] reject bad booking status
      ├── [GAP→TEST] fetch/persist throws → error propagates (500 path)
      └── [GAP→TEST] persist ok + synthesis throws → processed success, no throw

[+] src/app/api/webhooks/daily/route.ts
  ├── [★★ exists] routes transcript.ready / transcript.error
  └── [GAP→TEST] missing DAILY_WEBHOOK_HMAC → 500

[+] src/app/api/admin/bookings/[id]/reclaim-transcript
  ├── [GAP→TEST] non-admin → 403
  ├── [GAP→TEST] missing transcriptId → 400
  ├── [GAP→TEST] happy path mocks fulfill → 200
  └── [GAP→TEST] access-link failure → 4xx/5xx with message

USER / OPS FLOWS
[+] Paid-call transcript promise
  ├── [GAP→OPS] HMAC set + webhook ACTIVE
  ├── [GAP→OPS] domain storage true
  ├── [GAP→OPS] rehearsal → session_transcripts row
  └── [GAP→OPS] reclaim drill (staging): delete row optional, reclaim with Daily id

COVERAGE TARGET: all new branches unit-tested; go-live = OPS preflight
```

**CRITICAL regression:** Incident mode “storage off / access-link fails” must still surface as error (never invent utterances). Existing `fetch-daily-transcript.test.ts` covers access-link failure.

## Failure modes

| Failure | Handled? | User sees |
|---------|----------|-----------|
| HMAC missing | Ops gate | Webhooks 500; booking may still complete via leave |
| Storage off | Preflight + room prop | access-link error; no row; reclaim fails honestly |
| Webhook missed, VTT exists | Admin reclaim | Admin restores; user eventually sees panel |
| Fetch blip | Daily retry (500 before persist) | Delay then success |
| LLM timeout after persist | Durable-first | Transcript present; recap may lag until reclaim/re-run gate |
| Leave complete without transcript | Existing | Booking completed; honesty panel shows processing → unavailable — **not** success for transcript product |

## Design (honesty-only — design review)

**Scope:** Buyer/mentor **completed session** transcript honesty. No visual redesign, no mockups, no admin reclaim UI. Calibrate to existing session shell tokens (`text-body-md`, `text-on-surface-variant`, `min-h-11` controls).

**Initial design score:** 3/10 → **target 8/10** after honesty table lands (not 10: no dedicated status API, no mobile-specific layout change).

### Pass scores (design review)

| Pass | Dimension | Before | After plan | Notes |
|------|-----------|--------|------------|--------|
| 1 | Information architecture | 5 | 8 | Completed shell order stays: title → complete status → **recap** → **transcript** → exit. Transcript is secondary to recap; do not reorder. |
| 2 | Interaction states | 3 | 9 | Three-phase missing transcript + existing success/error; see table |
| 3 | Journey / emotion | 4 | 8 | Storyboard below |
| 4 | AI slop | 8 | 9 | Utility copy only; no marketing chrome |
| 5 | Design system | 7 | 8 | Reuse panel styles; no new components |
| 6 | Responsive / a11y | 6 | 8 | Status text `aria-live="polite"`; 44px touch already on shell buttons |
| 7 | Unresolved | — | 0 open | Thresholds locked as defaults below |

### Information hierarchy (completed session)

```
Session completed                    [H3 — primary]
  Finishing… / Retry recap           [if fulfillment running|error]
  Recap                              [primary artifact users expect]
  Session transcript                 [secondary; honesty states here]
  Back to dashboard                  [exit]
```

Constraint worship (only 3 messages if transcript missing): (1) still preparing, (2) taking longer, (3) not available for this session.

### Interaction state table (buyer/mentor transcript panel)

Timers start when the completed-session UI mounts (or when panel first 404s). No backend status column required.

| Feature | Loading | Empty / missing | Error (API 5xx) | Success | Partial |
|---------|---------|-----------------|-----------------|---------|---------|
| **Transcript panel** | “Loading session transcript…” (unchanged) | **Phase 1 (0–2 min):** “Preparing your transcript. This usually takes a minute after the call ends.” **Phase 2 (2–10 min):** “Transcript is still processing. You can leave and return later — it will appear here when ready.” **Phase 3 (10+ min):** “Transcript is not available for this session.” (no fake “yet”; no support CTA required) | Soft error: “Could not load transcript. Try again in a moment.” + optional retry control reusing shell button styles | Utterance list + locale toggle (unchanged) | Empty utterances array after 200: treat as Phase 3 unavailable (not success) |
| **Recap panel** | Existing pending/translate copy | Existing | Existing retry | Existing | If recap is empty-apology template **and** transcript Phase 3: do **not** imply words were captured; leave recap text as-is (LLM apology already honest enough) |
| **Admin reclaim** | N/A (API only) | N/A | JSON error | 200 + audit | N/A |

### Behavior rules

1. **Poll** `GET /api/session/[bookingId]/transcript` every **15s** while in Phase 1 or 2 and response is 404 / empty. Stop polling in Phase 3 or on success.
2. **Do not** invent utterances. Never show a success list from stubs outside e2e.
3. **Booking completed ≠ transcript ready.** Header “Session completed” may show while transcript is still Phase 1–2.
4. **Dashboard embed** (`DashboardSessionTranscript`) uses the same panel component — same honesty states.
5. **Transcription product off** (`DAILY_TRANSCRIPTION_ENABLED` false): if no row after complete, skip Phase 1–2 marketing of “preparing” if we can detect transcription off server-side; if not detectable from client, Phase 3 after 10 min is acceptable. Prefer: if first 404 after complete and env is unknown, still use three phases (harmless when transcription off and no row ever arrives).

### User journey storyboard

```
STEP | USER DOES              | USER FEELS           | PLAN SUPPORTS
-----|------------------------|----------------------|----------------
1    | Ends paid call         | Relief / done        | complete + “Session completed”
2    | Sees recap loading     | Expects value        | existing recap pending
3    | Looks for transcript   | Paid for words?      | Phase 1 “Preparing…”
4    | Waits 3+ min           | Mild anxiety         | Phase 2 “still processing / leave and return”
5a   | Transcript appears     | Trust restored       | Success list
5b   | 10+ min still empty    | Frustrated but clear | Phase 3 “not available for this session”
6    | Ops reclaim (admin)    | Invisible to user    | API only; panel becomes success on next load
```

### Copy (exact strings for implementers)

| Phase | Copy |
|-------|------|
| Loading | `Loading session transcript…` |
| Processing (0–2 min) | `Preparing your transcript. This usually takes a minute after the call ends.` |
| Delayed (2–10 min) | `Transcript is still processing. You can leave and return later — it will appear here when ready.` |
| Unavailable (10+ min or empty success body) | `Transcript is not available for this session.` |
| Load error | `Could not load transcript. Try again in a moment.` |

Utility language only. No “unlock”, “magic”, or support email hard-coded (ops contact remains out of band).

### Design NOT in scope

| Item | Why |
|------|-----|
| Mockups / redesign of session room | Honesty-only; existing shell |
| Admin reclaim UI / ops dashboard page | API + curl is enough for n≈10 |
| Backend `transcript_status` column for UI | Client timer sufficient for this ship |
| Marketing landing copy about transcripts | Product marketing separate; preflight gates truth |
| Spanish copy variants for honesty strings | Follow existing locale patterns later if needed; English first |

### Design implementation tasks

- [ ] **TD1 (P2, human: ~45min / CC: ~15min)** — Three-phase honesty in `SessionTranscriptPanel`
  - Surfaced by: design review DD2
  - Files: `src/components/session/session-transcript-panel.tsx` (+ test if practical)
  - Verify: completed booking with no row shows Phase 1 → Phase 2 after mocked time; success when API returns utterances
  - Does **not** block ops HMAC or room-storage PR if split; should land before or with next paid call if product promises transcript

## NOT in scope

| Item | Why deferred |
|------|----------------|
| Cloud recording + offline re-STT | Consent, storage, product scope |
| Live caption server-side canonical store | Architecture change; captions ephemeral by design |
| `session_transcripts.status` / webhook event table | Observability nicety; audit_log + preflight first |
| Disable HMAC verify in any env | Security |
| Auto-pick latest Daily transcript | Wrong-artifact risk |
| Full UI redesign / mockups / admin reclaim chrome | Design review: honesty-only |
| Recover lost 2026-07-21 call | Unrecoverable (no VTT, no recording) |

## Implementation order

1. **Ops HMAC + domain storage** (can parallel with code).
2. **Code PR:** room prop + durable-first + admin reclaim + tests.
3. **Deploy** to production.
4. **Rehearsal preflight** (hard gate).
5. **Next paid call** only if green.

### Parallelization

| Lane | Work | Depends |
|------|------|---------|
| Lane A | Ops HMAC + domain check + webhook events | — |
| Lane B | Code (1.1–1.3) | — |
| Then | Deploy + Phase 2 rehearsal | A + B |

Sequential after merge: deploy → rehearsal → paid call.

## Rollback

- Code: revert PR (room prop, reclaim route, durable-first). Rooms already created keep Daily-side props.
- Ops: do not remove `DAILY_WEBHOOK_HMAC` once set.
- Domain storage: leave true.

## Go / No-Go

**GO WITH CONDITIONS** after:

1. `DAILY_WEBHOOK_HMAC` set and webhook not FAILED  
2. Domain storage true  
3. Code shipped (room prop + durable-first + reclaim)  
4. Green rehearsal (`session_transcripts` non-empty + panel)

**NO-GO** if any of 1–4 missing while product promises post-call transcript.

## References

- `src/app/api/webhooks/daily/route.ts`
- `src/lib/daily.ts` — `createDailyRoomForBooking`, `verifyDailyWebhookSignature`, parsers
- `src/lib/post-session.ts` — `fulfillBookingAfterTranscriptReady`
- `src/lib/transcript-translation/fetch-daily-transcript.ts`
- Daily webhooks: https://docs.daily.co/reference/rest-api/webhooks (create response includes `hmac`)

## Decision ledger

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Ops + code minimum | Protect next paid call without event-store rewrite |
| HMAC | Recover Daily secret; always verify | Daily API returns hmac; unsigned webhooks unacceptable |
| Room storage | Property on create | Defense in depth vs domain drift |
| Reclaim | Admin API + explicit transcriptId | Best-practice recovery; `requireApiRole('admin')` |
| Webhook | Durable-first | Transcript durability ≠ recap latency |
| Rehearsal | Hard gate | Product promise requires proof |
| Tests | Units + manual preflight | CI cannot substitute prod Daily domain |
| Design scope | Honesty-only | Trust without mockup/admin UI scope |
| Missing transcript copy | Processing → delayed → unavailable | Avoid forever-“yet”; allow webhook lag |

## Test ledger

| Layer | What |
|-------|------|
| Unit | Room create body; durable-first; reclaim authz; HMAC missing 500 |
| Unit/UI | Panel phase copy transitions (timer mocked) when practical |
| Ops | Preflight access-link + DB row + panel shows utterances |
| Out | Live Daily Playwright CI; recording E2E; admin reclaim UI |

## Simplification

- No job queue; no schema migration; no recording; no caption persistence rewrite.
- Reuse webhook fulfill for reclaim.
- Ops HMAC is the highest leverage fix; code without HMAC is incomplete.
- Design: copy/timer only — no new design system, no mockups.

## Engineering discipline closeout

**Decisions:** Eng D1–D8 + design DD1–DD2 accepted; recording/event table/admin UI deferred  
**Tests:** Named above; honesty panel test optional if time-boxed  
**Simplification:** Honesty without status schema  
**Next action:** Ops HMAC recovery, then implement code PR (1.1–1.3 + 1.5)

## Approved Mockups

From `/design-shotgun` 2026-07-22 (post-call session completed).

| Screen/Section | Mockup Path | Direction | Notes |
|----------------|-------------|-----------|-------|
| Post-call session completed | `~/.gstack/projects/CarlosPHernandez-AstroLink/designs/post-call-session-completed-20260722/variant-A.jpg` | **A Mission debrief** (approved) | Calm light shell; recap first; transcript preparing card; blue primary. Align honesty copy to plan Phase 1–3 strings. |
| (rejected) Telemetry strip | `.../variant-B.jpg` | B | Dark ops density — not for mentee post-call |
| (rejected) Trust first | `.../variant-C.jpg` | C | Warm paper — too illustrative for current product shell |
| Comparison board | `.../design-board.html` | — | Local: `http://127.0.0.1:8765/design-board.html` when served |

**Implementer constraint:** Prefer Mission debrief hierarchy and calm surfaces. Do not ship dark telemetry chrome or coffee-cup empty states. Honesty strings remain as locked in Design section (not marketing copy from mockups).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 0 open issues; 0 critical gaps; decisions D1–D8 locked |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score 3→8/10; honesty-only; DD1–DD2 locked; 0 unresolved |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **VERDICT:** ENG + DESIGN CLEARED — implement ops HMAC + code + honesty panel + hard rehearsal before next paid call

NO UNRESOLVED DECISIONS

