# Video session reference

Live 1:1 sessions use [Daily.co](https://www.daily.co/) for WebRTC video. AstroLink provisions **private** rooms after payment, mints **meeting tokens** server-side per page load, and completes bookings when Daily sends `meeting.ended`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DAILY_API_KEY` | Yes (live sessions) | Daily REST API key. Creates rooms and meeting tokens. |
| `DAILY_WEBHOOK_HMAC` | Yes (production capture) | Base64 HMAC secret from Daily dashboard. Verifies `POST /api/webhooks/daily`. |
| `SKIP_STRIPE_PAYMENTS` | Local dev | When `true`, skips Stripe; use dev fulfill instead of card checkout. |

See [.env.example](../../.env.example) for the full list.

## Session gates

`getBookingForSession()` in `src/lib/booking-access.ts` returns a `SessionGate` that drives the session page UI:

| Gate | Booking status | Room URL | User sees |
|------|----------------|----------|-----------|
| `pending_payment` | `pending_payment` | any | Payment required; no iframe |
| `payment_failed` | `payment_failed` | any | Payment failed message |
| `provisioning` | `confirmed` | missing | "Room preparing" + auto-retry |
| `ready` | `confirmed` | present | Daily iframe with tokenized URL |
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

Server page. Calls `getBookingForSession()`, renders `SessionRoomClient` with gate, role, and optional `dailyJoinUrl`.

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
| `roomExpiryUnix(scheduledAt?)` | `number` | Unix seconds. Default 48h; if scheduled, end of window + 4h buffer |
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

## UI test IDs (`session-room-client.tsx`)

| `data-testid` | When visible |
|---------------|--------------|
| `session-join-ready` | Gate `ready`, iframe loaded |
| `session-provisioning` | Gate `provisioning` |
| `session-payment-required` | Gate `pending_payment` |
| `session-completed` | Gate `completed` |

## Related

- [How to: video session demo](../how-to/video-session-demo.md)
- [Explanation: architecture](../explanation/video-session-architecture.md)
- [Tutorial: first video session](../tutorial/first-video-session.md)
