# Video session demo runbook

Production-ready rehearsal for the D1 golden path: pay → Daily room → `/session/[bookingId]` → `meeting.ended` → capture + recap.

See also [d1-implementation-plan.md](../d1-implementation-plan.md) and [d2-next-steps.md](../d2-next-steps.md).

**Related:** [Tutorial: first video session](../tutorial/first-video-session.md) · [Reference](../reference/video-session.md) · [Architecture](../explanation/video-session-architecture.md)

## Environment

| Variable | Purpose |
|----------|---------|
| `DAILY_API_KEY` | Create private rooms + meeting tokens |
| `DAILY_WEBHOOK_HMAC` | Verify `POST /api/webhooks/daily` (base64 secret from Daily dashboard) |
| `DAILY_TRANSCRIPTION_ENABLED=true` | Mentor tokens auto-start transcription; APX-03 runs on `transcript.ready-to-download` |
| `SKIP_STRIPE_PAYMENTS=true` | Skip Stripe; use dev fulfill |
| Stripe test keys | Real card flow + `stripe listen` |

```bash
npm run dev
```

## Preflight (before investor demo)

1. `DAILY_API_KEY` and `DAILY_WEBHOOK_HMAC` set in `.env.local`.
2. Daily dashboard webhook points to your tunnel: `https://<tunnel>/api/webhooks/daily`, events `meeting.ended` and (when transcription is on) `transcript.ready-to-download`.
3. Daily domain transcription enabled when using `DAILY_TRANSCRIPTION_ENABLED=true`.
4. Send a test webhook from Daily or complete one dry-run call and confirm app logs show `received: true`.
5. If using Stripe: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running.
6. Two browsers (or profiles): mentee `carlos@astrolink.ai`, mentor `chris@astrolink.ai` (seed users).
7. **Phone / second device on Wi‑Fi:** run `npm run dev:lan` and open the **Phone** URL it prints (e.g. `https://10.0.0.49:3000` — not `https://0.0.0.0:3000`). Accept Safari's cert warning. Plain `http://<LAN-IP>:3000` blocks camera/mic. **Mac mentor:** `https://localhost:3000` while `dev:lan` is running.
8. Allow camera/microphone for your Daily domain when the call UI loads.

## Standard demo script (&lt;15 min)

1. Sign in as mentee → book Chris → pay (test card) **or** book with skip-Stripe and `POST /api/book/fulfill` with `{ "bookingId": "..." }`.
2. Mentee dashboard: confirm status `confirmed`, **View brief**, **Join room**.
3. Second browser: sign in as mentor → mentor dashboard → **Join room** for the same booking.
4. Both land on `/session/[id]` with light shell + `DailyCallRoom` (tokenized private room via `createCallObject`).
5. **End the call inside Daily’s UI** (hang up). The header **End session** button only updates local UI; it does **not** capture payment.
6. Within ~1 minute: booking `completed`, mentee sees English recap on `/session/[id]` and dashboard.
7. With transcription enabled: recap content should reference call topics (RPO, delta-V, etc.) after `transcript.ready-to-download`, not the empty-transcript apology template.
8. Stripe (if used): payment intent `requires_capture` → captured after step 5 (`meeting.ended`).

## Live captions demo (D3 Phase 3 — bidirectional)

1. Set `DAILY_TRANSCRIPTION_ENABLED=true` in `.env.local` and enable transcription on your Daily domain.
2. Set mentee `preferred_locale` to a non-English value (e.g. `es`) via `/dashboard/mentee/settings`. Mentor can stay on `en`.
3. For phone + laptop: `npm run dev:lan` → open `https://<LAN-IP>:3000` on both devices (camera/mic require HTTPS on mobile).
4. Run the two-user join script above. Mentor should see **Captions on for buyer** when locales differ.
5. Mentee toggles the caption rail below the video. Speak English on the mentor side — Spanish lines should appear within ~2s. If the mentor’s locale differs from the mentee’s, mentor captions translate the other way too.
6. If you hit LLM rate limits, the rail shows **Live translation paused** with original speech until the window clears (not a hard error).
7. After the call completes, the session page shows a **transcript panel** with optional localized toggle.
8. E2E coverage: `npm run test:e2e -- e2e/live-captions.spec.ts` (stubs LLM; pins `DAILY_TRANSCRIPTION_ENABLED=false`). Real dual-device caption flow is manual.

## Two-user join proof

- Mentee and mentor must each open `/session/[bookingId]` while logged in as the correct user.
- Room is `privacy: private`; the call UI fetches a join URL with a short-lived meeting token when the participant joins.
- Unauthenticated users redirect to sign-in. Wrong participant gets forbidden (dashboard redirect).

## Failure cheatsheet

| Symptom | Likely cause | Recovery |
|---------|--------------|----------|
| No **Join room** / “Room preparing” | Room not provisioned yet | Wait 30s and refresh; use **Retry room setup** on session page; or `POST /api/book/fulfill` |
| Session page “Payment required” | `pending_payment` | Fulfill payment or dev fulfill |
| Call UI blank / denied | Missing token or Daily outage | Check server logs for `bookingId`; reprovision via dev operator (below) |
| Call UI “something went wrong” / no camera on phone | Plain HTTP on LAN IP blocks camera/mic | `npm run dev:lan` → `https://<LAN-IP>:3000` on phone; session page shows steps |
| Booking stuck `confirmed`, no recap | `meeting.ended` webhook missed | Re-end call in Daily, or dev simulate (below) |
| Booking `completed` but recap is generic apology | Transcription off or `transcript.ready` missed | Set `DAILY_TRANSCRIPTION_ENABLED=true`; subscribe webhook; or `simulate_transcript_ready` |
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

```json
{ "bookingId": "<uuid>", "action": "simulate_transcript_ready" }
```

Ingests `src/lib/transcript-translation/__fixtures__/sample.vtt`, persists `session_transcripts`, and runs APX-03 (dev only).

Production-safe retry without dev tools: `POST /api/session/provision` with `{ "bookingId": "..." }` when status is `confirmed` and room URL is missing.

## Dry-run checklist

- [ ] Full chain twice on a clean clone within 24h of the pitch
- [ ] Mentee + mentor both joined with video/audio
- [ ] Webhook completed booking and recap visible
- [ ] Documented fallback tested once (`simulate_meeting_ended` or manual webhook)

## Security talking points

1. **App gate**: only mentee, mentor, or admin can open `/session/[id]`.
2. **Daily gate**: private room + short-lived meeting token per authorized join.
3. **Media**: encrypted in transit via Daily (WebRTC); AstroLink does not store recordings in D1.

Do not claim HIPAA or stored E2E review unless D2 compliance features ship.
