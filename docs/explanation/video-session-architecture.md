# Video session architecture

AstroLink connects paying mentees with verified aerospace experts for live video calls. The D1 design optimizes for **demo reliability** and a **minimum security floor**: strangers cannot join a room by guessing a URL.

## The problem

Without guardrails, a video session product has three failure modes:

1. **Open rooms** — Anyone with the Daily room link can enter. Bad for paid, private expert calls.
2. **Fake join credentials** — Storing static "tokens" in the database does not match Daily's private-room model and leaks if the DB is exposed.
3. **Wrong completion signal** — If the app marks a session "done" when the user clicks a local button, payments capture before the call actually happened (or never capture after a real call).

## End-to-end flow

```
Pay / fulfill          Provision room           Open session page          Call ends
─────────────          ──────────────           ─────────────────          ─────────

Stripe webhook   →    post-payment.ts    →    GET /session/[id]    →    DailyCallRoom
or dev fulfill        provisionDailyRoom       getBookingForSession       hang up in Daily
                      (private room)           render gated session shell
                      save daily_room_url      fetch join URL on join
                                                      │
                                                      ▼
                                               POST /api/webhooks/daily
                                               meeting.ended
                                                      │
                                                      ▼
                                               post-session.ts
                                               recap + Stripe capture
                                               status → completed
```

## Design decisions

### Private rooms + on-join meeting tokens

Daily private rooms reject joins without a valid meeting token. AstroLink:

1. Creates the room once after payment (`provisionDailyRoomForBooking`).
2. Stores only the **room URL** on the booking.
3. Mints a **short-lived token** only when the authorized participant joins (`GET /api/session/[bookingId]/join-url`).

Legacy columns `mentee_token` and `mentor_token` are cleared on provision. Tokens are never persisted.

**Trade-off:** The join action depends on a server round trip, but browsing or refreshing the session page no longer spends a Daily token request.

### Two-layer access control

| Layer | Check | Failure mode |
|-------|-------|--------------|
| App (`booking-access`) | Session cookie; user is mentee, mentor, or admin | Redirect / forbidden |
| Daily (private + token) | Valid meeting token for that room | Iframe join denied |

Both must pass. The app never embeds a naked room URL without `?t=`.

### Webhook-driven completion

Business completion is **`meeting.ended` from Daily**, not the cosmetic "End session" button in the AstroLink header. That button only updates local UI during the call.

`fulfillBookingAfterMeetingEnded` is **idempotent**: duplicate webhooks or dev simulate calls do not double-capture or duplicate session rows.

**Trade-off:** If the webhook is missed (tunnel down, misconfigured HMAC), the booking stays `confirmed` and Stripe stays authorized until manual recovery or D2 reconciliation. The demo runbook documents dev fallbacks.

### Provisioning wait state

Room creation runs async after payment. The session page shows `provisioning` when status is `confirmed` but `daily_room_url` is null. The client auto-refreshes and offers **Retry room setup** (`POST /api/session/provision`).

**Trade-off:** Simpler than websockets for D1; user may wait a few seconds after pay before join works.

### Light theme session shell

The session room uses AstroLink's light shell (`globals.css` tokens) around a custom Daily call object. Dark chrome was deferred so the demo matches the public landing aesthetic.

## Phase 3 update (v0.2.0.0 — bidirectional captions)

As of D3 Phase 3, `/session/[id]` uses `@daily-co/daily-js` `createCallObject()` instead of a Daily iframe embed:

- `DailyCallRoom` renders participant video tiles and call controls.
- When `DAILY_TRANSCRIPTION_ENABLED=true`, the mentor (owner) join starts Daily transcription (`language: 'multi'`, `model: 'nova-3'`). Rejoin does not call `startTranscription` twice.
- `transcription-message` events resolve the speaker, pick translate direction per viewer (`caption-direction.ts`), and enqueue segment translation (`translation-queue.ts` → `translate-segment`).
- Each participant with a non-matching locale sees a caption rail below the video. Rate limits surface a paused banner with original text, not a fatal error.
- Mentors see **Captions on for buyer** when the mentee locale ≠ `en`.
- After `completed`, `SessionTranscriptPanel` loads utterances via `GET .../transcript` and optional batch localize.

Private rooms, on-join meeting tokens, and webhook-driven completion are unchanged from D1.

## What D1 explicitly does not do

- HIPAA BAA or stored recording review (unchanged)
- Escrow reconciliation job for missed webhooks (D2)
## Alternatives considered

| Approach | Why not for D1 |
|----------|----------------|
| Public Daily rooms | No access control on the video layer |
| Static tokens in DB | Not how Daily private rooms work; security smell |
| Client-side token mint | Would expose `DAILY_API_KEY` |
| Complete on button click | Captures payment without proof the call happened |

## Related

- [Reference: video session](../reference/video-session.md)
- [How to: demo runbook](../how-to/video-session-demo.md)
- [D2 next steps](../d2-next-steps.md)
