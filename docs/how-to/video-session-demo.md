# Video session demo runbook

Production-ready rehearsal for the D1 golden path: pay → Daily room → `/session/[bookingId]` → `meeting.ended` → capture + recap.

See also [d1-implementation-plan.md](../d1-implementation-plan.md) and [d2-next-steps.md](../d2-next-steps.md).

**Related:** [Tutorial: first video session](../tutorial/first-video-session.md) · [Reference](../reference/video-session.md) · [Architecture](../explanation/video-session-architecture.md)

## Environment

| Variable | Purpose |
|----------|---------|
| `DAILY_API_KEY` | Create private rooms + meeting tokens |
| `DAILY_WEBHOOK_HMAC` | Verify `POST /api/webhooks/daily` (base64 secret from Daily dashboard) |
| `SKIP_STRIPE_PAYMENTS=true` | Skip Stripe; use dev fulfill |
| Stripe test keys | Real card flow + `stripe listen` |

```bash
npm run dev
```

## Preflight (before investor demo)

1. `DAILY_API_KEY` and `DAILY_WEBHOOK_HMAC` set in `.env.local`.
2. Daily dashboard webhook points to your tunnel: `https://<tunnel>/api/webhooks/daily`, event `meeting.ended`.
3. Send a test webhook from Daily or complete one dry-run call and confirm app logs show `received: true`.
4. If using Stripe: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running.
5. Two browsers (or profiles): mentee `carlos@astrolink.ai`, mentor `chris@astrolink.ai` (seed users).
6. **Phone / second device on Wi‑Fi:** run `npm run dev:lan` and open `https://<LAN-IP>:3000` (accept Safari's cert warning). Plain `http://192.168.x.x:3000` blocks camera/mic. **Mac mentor:** `http://localhost:3000` is fine.
7. Allow camera/microphone for your Daily domain when the iframe loads.

## Standard demo script (&lt;15 min)

1. Sign in as mentee → book Chris → pay (test card) **or** book with skip-Stripe and `POST /api/book/fulfill` with `{ "bookingId": "..." }`.
2. Mentee dashboard: confirm status `confirmed`, **View brief**, **Join room**.
3. Second browser: sign in as mentor → mentor dashboard → **Join room** for the same booking.
4. Both land on `/session/[id]` with light shell + Daily iframe (tokenized private room).
5. **End the call inside Daily’s UI** (hang up). The header **End session** button only updates local UI; it does **not** capture payment.
6. Within ~1 minute: booking `completed`, mentee sees recap on dashboard.
7. Stripe (if used): payment intent `requires_capture` → captured after step 5.

## Two-user join proof

- Mentee and mentor must each open `/session/[bookingId]` while logged in as the correct user.
- Room is `privacy: private`; join URL includes a short-lived meeting token minted server-side per page load.
- Unauthenticated users redirect to sign-in. Wrong participant gets forbidden (dashboard redirect).

## Failure cheatsheet

| Symptom | Likely cause | Recovery |
|---------|--------------|----------|
| No **Join room** / “Room preparing” | Room not provisioned yet | Wait 30s and refresh; use **Retry room setup** on session page; or `POST /api/book/fulfill` |
| Session page “Payment required” | `pending_payment` | Fulfill payment or dev fulfill |
| Iframe blank / denied | Missing token or Daily outage | Check server logs for `bookingId`; reprovision via dev operator (below) |
| Iframe “something went wrong” / no camera on phone | Plain HTTP on LAN IP blocks camera/mic | `npm run dev:lan` → `https://<LAN-IP>:3000` on phone; session page shows steps |
| Booking stuck `confirmed`, no recap | `meeting.ended` webhook missed | Re-end call in Daily, or dev simulate (below) |
| Escrow not captured | Webhook never ran | Same as above; escrow stays authorized until capture |

## No-show / webhook miss

- Business completion for D1 is driven by Daily `meeting.ended`, not the cosmetic **End session** button.
- If the webhook never arrives, the booking stays `confirmed` and Stripe stays in `requires_capture` until manual recovery or D2 reconciliation.
- For demos, use the dev operator to simulate `meeting.ended` (development only).

## Dev operator (development only)

`POST /api/dev/session-operator` (admin or booking participant)

```json
{ "bookingId": "<uuid>", "action": "status" }
```

```json
{ "bookingId": "<uuid>", "action": "provision" }
```

```json
{ "bookingId": "<uuid>", "action": "simulate_meeting_ended" }
```

Production-safe retry without dev tools: `POST /api/session/provision` with `{ "bookingId": "..." }` when status is `confirmed` and room URL is missing.

## Dry-run checklist

- [ ] Full chain twice on a clean clone within 24h of the pitch
- [ ] Mentee + mentor both joined with video/audio
- [ ] Webhook completed booking and recap visible
- [ ] Documented fallback tested once (`simulate_meeting_ended` or manual webhook)

## Security talking points

1. **App gate**: only mentee, mentor, or admin can open `/session/[id]`.
2. **Daily gate**: private room + short-lived meeting token per authorized load.
3. **Media**: encrypted in transit via Daily (WebRTC); AstroLink does not store recordings in D1.

Do not claim HIPAA or stored E2E review unless D2 compliance features ship.
