# Video session reference

Live 1:1 sessions use [Daily.co](https://www.daily.co/) for WebRTC video. AstroLink provisions **private** rooms after payment, mints **meeting tokens** server-side per page load, and completes bookings when Daily sends `meeting.ended`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DAILY_API_KEY` | Yes (live sessions) | Daily REST API key. Creates rooms and meeting tokens. |
| `DAILY_WEBHOOK_HMAC` | Yes (production capture) | Base64 HMAC secret from Daily dashboard. Verifies `POST /api/webhooks/daily`. |
| `DAILY_TRANSCRIPTION_ENABLED` | Phase 3 captions | When `true`, mentor join auto-starts Daily transcription (`multi` + `nova-3`); required for live captions in dev. E2E pins `false` and stubs translation via `E2E_STUB_LLM`. |
| `DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES` | Join gate | Default **0** (opens at scheduled start). Set &gt;0 for early entry. |
| `DAILY_ROOM_JOIN_WINDOW_AFTER_MINUTES` | Join gate | Default **60** after start. |
| `DAILY_MAX_CALL_MINUTES` | Fallback only | Used for `eject_after_elapsed` only when `bookings.duration_minutes` is missing. Live rooms use the **booked** duration. |
| `LLM_MAX_CAPTION_REQUESTS_PER_MINUTE` | Optional | Caption-scoped LLM rate limit (default 60). Separate from general `LLM_MAX_*` buckets. |
| `LLM_MAX_CAPTION_REQUESTS_PER_HOUR` | Optional | Default 300. |
| `LLM_MAX_CAPTION_REQUESTS_PER_DAY` | Optional | Default 1000. |
| `SKIP_STRIPE_PAYMENTS` | Local dev | When `true`, skips Stripe; use dev fulfill instead of card checkout. |

See [.env.example](../../.env.example) for the full list.

## Session gates

`getBookingForSession()` in `src/lib/booking-access.ts` returns a `SessionGate` that drives the session page UI:

| Gate | Booking status | Room URL | User sees |
|------|----------------|----------|-----------|
| `pending_payment` | `pending_payment` | any | Payment required; no call UI |
| `payment_failed` | `payment_failed` | any | Payment failed message |
| `provisioning` | `confirmed` | missing | "Room preparing" + auto-retry |
| `ready` | `confirmed` | present | `DailyCallRoom` (`createCallObject`) with tokenized join |
| `completed` | `completed` | any | Session ended; link to recap |
| `unavailable` | other | any | Generic unavailable state |

## Session roles

| Role | Who | Daily `is_owner` |
|------|-----|------------------|
| `mentee` | `bookings.mentee_id` matches session user | `false` |
| `mentor` | `bookings.mentor_id` matches session user | `true` |
| `admin` | App session role `admin` | `true` |

Anyone else gets `forbidden: true` (redirect to dashboard).

## HTTP routes

### `GET /session/[bookingId]`

Server page. Calls `getBookingForSession()`, renders `SessionRoomClient` with gate, role, caption flags, and optional `dailyJoinUrl`.

### `POST /api/webhooks/daily`

Daily webhook receiver. Verifies HMAC, parses `meeting.ended`, calls `fulfillBookingAfterMeetingEnded()`.

**Headers (from Daily):** `x-webhook-signature`, `x-webhook-timestamp`

**Success body:** `{ "received": true, "processed": true, "bookingId": "..." }`

**Unsupported events:** `{ "received": true, "skipped": "unsupported_event" }`

### `POST /api/session/provision`

Retry room creation for a `confirmed` booking missing `daily_room_url`.

**Auth:** Logged-in mentee, mentor, or admin on that booking.

**Body:**

```json
{ "bookingId": "<uuid>" }
```

**Success (200):**

```json
{
  "success": true,
  "roomUrl": "https://….daily.co/astrolink-…",
  "roomName": "astrolink-…",
  "created": true
}
```

**Errors:** `401` unauthorized, `403` forbidden, `400` wrong status, `503` missing `DAILY_API_KEY`.

### `POST /api/session/[bookingId]/translate-segment`

Live caption segment translation (D3 Phase 3). Server enforces target locale from mentee `preferred_locale`; client may pass `targetLocale` for validation only.

**Auth:** Logged-in mentee, mentor, or admin on that booking.

**Body:**

```json
{
  "segmentId": "utterance-id",
  "text": "spoken caption line",
  "sourceLocale": "en",
  "targetLocale": "es"
}
```

**Success (200):**

```json
{
  "segmentId": "utterance-id",
  "translatedText": "…",
  "sourceLocale": "en",
  "targetLocale": "es",
  "cacheHit": false,
  "estimatedInputTokens": 12,
  "latencyMs": 340
}
```

**Errors:** `401` unauthorized, `403` forbidden, `400` missing fields or locale mismatch, `422` translation failure, `429` `rate_limited` or `budget_exceeded` (client shows paused banner + original text).

### `GET /api/session/[bookingId]/transcript`

Post-call transcript for a completed booking. Returns utterances with speaker roles mapped to mentee/mentor.

**Auth:** Logged-in participant on that booking.

**Success (200):** `{ utterances: TranscriptUtterance[], sourceLocale, speakers }`

### `POST /api/session/[bookingId]/transcript/translate`

Batch-translates transcript utterances to the mentee’s `preferred_locale` (APX-06 segment batch).

**Auth:** Logged-in participant on that booking.

### `GET /api/session/[bookingId]/join-url`

Returns a fresh authorized Daily join URL for the current user (server-minted meeting token).

**Auth:** Logged-in participant via `getBookingForSession()`.

### `POST /api/dev/session-operator` (non-production only)

Development operator for demo rehearsal. Returns `404` in production.

**Body:**

```json
{ "bookingId": "<uuid>", "action": "status" | "provision" | "simulate_meeting_ended" }
```

| Action | Effect |
|--------|--------|
| `status` | JSON snapshot: booking status, room URL, session row, env flags |
| `provision` | Same as `provisionDailyRoomForBooking` |
| `simulate_meeting_ended` | Calls `fulfillBookingAfterMeetingEnded` with synthetic payload |

## Library API (`src/lib/daily.ts`)

### Room naming and expiry

| Function | Returns | Notes |
|----------|---------|-------|
| `dailyRoomNameForBooking(bookingId)` | `string` | Pattern: `astrolink-{first 20 hex chars of uuid}` |
| `roomExpiryUnix(scheduledAt?, { durationMinutes? })` | `number` | Unix seconds. Default 48h; if scheduled, join-window end |
| `meetingTokenWindowUnix(scheduledAt, { durationMinutes? })` | window | `nbf`/`exp` from join window; `ejectAfterElapsed` from **booked duration** |
| `resolveCallDurationMinutes(duration?)` | `number` | Booked length (clamped) or env fallback |
| `meetingTokenExpiryUnix(roomExp?)` | `number` | Min(4h from now, room `exp`) |
| `extractDailyRoomNameFromUrl(url)` | `string \| null` | Parses Daily room name from URL path |

### Provisioning and join

| Function | Returns | Notes |
|----------|---------|-------|
| `createDailyRoomForBooking(bookingId, { scheduledAt? })` | `{ roomUrl, roomName }` | `privacy: private`, chat enabled |
| `provisionDailyRoomForBooking(bookingId)` | `{ roomUrl, roomName, created }` | Idempotent; clears legacy `mentee_token` / `mentor_token` |
| `createMeetingToken({ roomName, userId, userName, isOwner, exp? })` | `string` | Daily meeting token JWT |
| `buildAuthorizedDailyJoinUrl({ roomUrl, userId, userName, isOwner })` | `string` | Room URL + `?t=` token |
| `buildDailyJoinUrl(roomUrl, token)` | `string` | Pure URL builder |

### Webhook helpers

| Function | Returns | Notes |
|----------|---------|-------|
| `verifyDailyWebhookSignature({ rawBody, signatureHeader, timestampHeader, hmacSecretBase64 })` | `boolean` | HMAC-SHA256, timing-safe compare |
| `parseMeetingEndedEvent(body)` | payload or `null` | Requires `type === 'meeting.ended'` |

## Post-session (`src/lib/post-session.ts`)

`fulfillBookingAfterMeetingEnded(payload)` — idempotent:

1. Find booking by room name in `daily_room_url`
2. Skip if already `completed`
3. Require `confirmed` status
4. Insert/update `sessions` row with duration from webhook timestamps
5. Run session recap agent (APX-03)
6. Capture Stripe payment intent if present (APX-05)

## Database fields

| Table | Column | Purpose |
|-------|--------|---------|
| `bookings` | `daily_room_url` | Daily room URL after provisioning |
| `bookings` | `status` | `pending_payment` → `confirmed` → `completed` |
| `bookings` | `mentee_token`, `mentor_token` | Legacy; cleared on provision (tokens minted per request) |
| `sessions` | `booking_id`, `duration_minutes` | Written on `meeting.ended` |

## Session UI modules (Phase 3)

| Path | Role |
|------|------|
| `src/components/session/daily-call-room.tsx` | `createCallObject()` join, video tiles, transcription events |
| `src/components/session/use-daily-call.ts` | Daily lifecycle, `startTranscription({ language: 'multi' })` on owner join |
| `src/components/session/use-live-captions.ts` | Bidirectional caption state, translation queue, pause/resume |
| `src/components/session/caption-rail.tsx` | Caption band below video + toggle + paused banner |
| `src/components/session/session-transcript-panel.tsx` | Post-call transcript + localized toggle (`completed` gate) |
| `src/components/session/call-controls.tsx` | Mic, camera, local leave |

`getBookingForSession()` also returns `menteePreferredLocale`, `captionsAvailable`, and `showTranslatedCaptionsForBuyer` for the session shell.

## UI test IDs

| `data-testid` | When visible |
|---------------|--------------|
| `session-join-ready` | Gate `ready`, call object mounted |
| `session-daily-call` | Active Daily call surface |
| `session-captions-indicator` | Mentor header when buyer has non-English captions |
| `caption-rail` | Mentee with captions enabled |
| `session-provisioning` | Gate `provisioning` |
| `session-payment-required` | Gate `pending_payment` |
| `session-completed` | Gate `completed` |

## Related

- [How to: video session demo](../how-to/video-session-demo.md)
- [Explanation: architecture](../explanation/video-session-architecture.md)
- [Tutorial: first video session](../tutorial/first-video-session.md)
