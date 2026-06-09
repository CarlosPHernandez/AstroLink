# Dual-device video demo (phone + computer)

Use two devices so mentee and mentor are different participants in Daily.

## Why HTTPS for the phone

Safari on iPhone **cannot** use `localhost` (that means the phone itself). A LAN URL like `http://192.168.1.13:3000` loads the app, but **camera/mic are blocked** over plain HTTP on non-localhost hosts.

**Fix:** run the dev server with HTTPS, then open the LAN URL on the phone:

```bash
npm run dev:lan
```

Next.js prints a **Network** line, e.g. `https://192.168.1.13:3000`. On the iPhone:

1. Open that URL in Safari (same Wi‑Fi as your Mac).
2. Tap through the certificate warning (**Advanced** → **Proceed** / trust for this session).
3. Allow camera/microphone when Daily asks.

On your Mac, `http://localhost:3000` still works for the mentor side.

## Accounts

| Device | Email | Role |
|--------|--------|------|
| Phone (Wi‑Fi) | `carlos@astrolink.ai` | Mentee |
| Computer | `carlosphernandez2020@gmail.com` | Mentor (demo) |
| Backup listed expert | `chris@astrolink.ai` | Mentor (seed; optional) |

Password on `/auth`: any string **6+ characters** (demo auth does not verify passwords).

## Env (local)

```bash
APP_MODE=full
ENABLE_DEMO_AUTH=true
SKIP_STRIPE_PAYMENTS=true
DAILY_API_KEY=...
DAILY_TRANSCRIPTION_ENABLED=true
```

For live translated captions (D3 Phase 3), set mentee `preferred_locale` to `es` (or `pt-BR`, `fr`, `ja`) in `/dashboard/mentee/settings` before joining. Mentor speaks English; mentee sees the caption rail.

Ensure `next.config.ts` `allowedDevOrigins` includes your Mac's LAN IP if HMR/actions fail from the phone (see comment in that file).

## Database

Apply migration `supabase/migrations/20260605120000_seed_carlos_demo_mentor.sql` on project `vwoizjesyyygmokfqpyy` (Supabase SQL editor or `supabase db push`).

## Script (~15 min)

1. **Mac:** `npm run dev:lan` → note `https://192.168.x.x:3000` from the terminal.
2. **Phone:** Sign in as `carlos@astrolink.ai` at the **https** LAN URL → book → **Join room** when the gate allows.
3. **Mac:** Sign in as `carlosphernandez2020@gmail.com` at `http://localhost:3000` → open the **same** `/session/[bookingId]` path → both enter video.
4. Optional: repeat with Chris slug `chris-sembroski` if needed.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Daily says "something went wrong" on phone | You are on `http://` LAN — switch to `npm run dev:lan` and `https://…` |
| Certificate warning on iPhone | Expected for self-signed dev cert; proceed once per session |
| Session page amber banner | Follow the HTTPS link shown on the banner |

## After the prospect demo

Ship real Supabase Auth (`feat/supabase-auth-signup`); expert creates their own account post-call.
