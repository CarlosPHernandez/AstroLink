# Tutorial: Your first video session locally

By the end of this tutorial you will book a session, join a private Daily room as mentee and mentor, and see the booking move to **completed** after the call ends.

**Time:** ~15 minutes  
**Prerequisites:** Node 20+, Supabase seed applied, `DAILY_API_KEY` in `.env.local`

## What you'll need

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Copy env and set at minimum:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Value for this tutorial |
   |----------|-------------------------|
   | Supabase keys | From project dashboard |
   | `SESSION_SECRET` | `openssl rand -hex 32` |
   | `SKIP_STRIPE_PAYMENTS` | `true` |
   | `DAILY_API_KEY` | From [Daily dashboard](https://dashboard.daily.co/) |
   | `DAILY_WEBHOOK_HMAC` | Base64 secret from Daily webhooks (for step 3) |

3. Apply migrations and seed (see [README](../../README.md#supabase-setup)).

## Step 1: Start the app and book a session

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Sign in as **Carlos** (`carlos@astrolink.ai` preset on `/auth`).
2. From the landing page, book **Chris Sembroski**.
3. Complete checkout (skip-Stripe confirms immediately).

**What happened:** `post-payment.ts` provisioned a private Daily room and saved `daily_room_url` on the booking.

## Step 2: Join as mentee and mentor

1. Mentee dashboard → **Join room** (or open `/session/{bookingId}`).
2. In a second browser profile, sign in as **Chris** (`chris@astrolink.ai`).
3. Mentor dashboard → **Join room** for the same booking.

**What you should see:** Light session shell, Daily iframe, both sides in the call. The join URL includes a token (`?t=…`); the room is not joinable without it.

**Verification:** Page contains `[data-testid="session-join-ready"]` when the gate is `ready`.

## Step 3: End the call and complete the booking

1. **Hang up inside Daily's UI** (not only the AstroLink header button).
2. Ensure Daily can reach your webhook:
   - Tunnel: `ngrok http 3000` (or similar)
   - Daily dashboard → Webhooks → `https://<tunnel>/api/webhooks/daily`, event `meeting.ended`

Within ~1 minute the booking status becomes **completed** and the mentee dashboard shows a recap.

**No tunnel yet?** In development only:

```bash
curl -X POST http://localhost:3000/api/dev/session-operator \
  -H "Content-Type: application/json" \
  -H "Cookie: <your session cookie>" \
  -d '{"bookingId":"<uuid>","action":"simulate_meeting_ended"}'
```

Or sign in and use the same body from your HTTP client with session auth.

## What you built

You ran the full D1 golden path:

- Paid (or skip-Stripe) booking → private Daily room
- App auth + Daily token join
- Webhook-driven completion and recap

## Next steps

- [How to: investor demo runbook](../how-to/video-session-demo.md) — preflight, cheatsheet, talking points
- [Reference: APIs and gates](../reference/video-session.md) — full module and route listing
- [Explanation: why this architecture](../explanation/video-session-architecture.md)
