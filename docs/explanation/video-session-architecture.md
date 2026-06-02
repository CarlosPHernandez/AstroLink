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

Stripe webhook   →    post-payment.ts    →    GET /session/[id]    →    Daily iframe
or dev fulfill        provisionDailyRoom       getBookingForSession       hang up in Daily
                      (private room)           mint meeting token
                      save daily_room_url      iframe ?t=token
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

### Private rooms + per-load meeting tokens

Daily private rooms reject joins without a valid meeting token. AstroLink:

1. Creates the room once after payment (`provisionDailyRoomForBooking`).
2. Stores only the **room URL** on the booking.
3. Mints a **short-lived token** on each authorized page load (`buildAuthorizedDailyJoinUrl`).

Legacy columns `mentee_token` and `mentor_token` are cleared on provision. Tokens are never persisted.

**Trade-off:** Extra Daily API call on every session page load. Acceptable for D1 volume; cache later if needed.

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

The session iframe uses Daily's UI inside AstroLink's light shell (`globals.css` tokens). Dark chrome was deferred so the demo matches the public landing aesthetic.

## What D1 explicitly does not do

- Daily Prebuilt SDK or custom tracks (iframe embed only)
- Transcript fetch from Daily API (recap uses booking context; transcript hook is D2)
- HIPAA BAA or stored recording review
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
