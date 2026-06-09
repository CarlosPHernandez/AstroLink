# Dual-device video demo (phone + computer)

Use two devices so mentee and mentor are different participants in Daily.

## Why HTTPS for the phone

Safari on iPhone **cannot** use `localhost` (that means the phone itself). A LAN URL like `http://192.168.1.13:3000` loads the app, but **camera/mic are blocked** over plain HTTP on non-localhost hosts.

**Fix:** run the dev server with HTTPS, then open your Mac's **LAN IP** on the phone:

```bash
npm run dev:lan
```

The script prints the phone URL before Next.js starts, e.g. `https://10.0.0.49:3000`.

### Do not use `https://0.0.0.0:3000`

`dev:lan` binds on all interfaces (`0.0.0.0`). Next.js may print:

```text
Network: https://0.0.0.0:3000
```

That is the **listen address**, not a URL you can open on the iPhone. Use the `Phone (Safari on Wi‑Fi)` line from the script, or find your IP another way:

| Method | Example |
|--------|---------|
| `npm run dev:lan` banner | `https://10.0.0.49:3000` |
| `npm run dev` (HTTP) Network line | `http://10.0.0.49:3000` → same IP, switch to `https` for the phone |
| Terminal | `ipconfig getifaddr en0` |
| macOS | System Settings → Wi‑Fi → Details → IP address |

On the iPhone:

1. Open `https://<LAN-IP>:3000` in Safari (same Wi‑Fi as your Mac).
2. Tap through the certificate warning (**Advanced** → **Proceed** / trust for this session).
3. Allow camera/microphone when Daily asks.

On your Mac, `https://localhost:3000` works for the mentor side while `dev:lan` is running.

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

`npm run dev:lan` sets `DEV_LAN_ORIGIN` automatically so Next.js allows HMR and server actions from your phone. If you still see “Blocked cross-origin request … from \<LAN-IP\>” in the terminal, restart `dev:lan` (DHCP may have changed your IP).

## Database

Apply migration `supabase/migrations/20260605120000_seed_carlos_demo_mentor.sql` on project `vwoizjesyyygmokfqpyy` (Supabase SQL editor or `supabase db push`).

## Script (~15 min)

1. **Mac:** `npm run dev:lan` → copy the **Phone** URL from the terminal (not `0.0.0.0`).
2. **Phone:** Sign in as `carlos@astrolink.ai` at that **https** LAN URL → book → **Join room** when the gate allows.
3. **Mac:** Sign in as `carlosphernandez2020@gmail.com` at `https://localhost:3000` → open the **same** `/session/[bookingId]` path → both enter video.
4. Optional: repeat with Chris slug `chris-sembroski` if needed.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Safari cannot open `https://0.0.0.0:3000` | Expected — use `https://<LAN-IP>:3000` from the `dev:lan` banner or `ipconfig getifaddr en0` |
| Daily says "something went wrong" on phone | You are on `http://` LAN — switch to `npm run dev:lan` and `https://<LAN-IP>:3000` |
| Certificate warning on iPhone | Expected for self-signed dev cert; proceed once per session |
| Session page amber banner | Follow the HTTPS link shown on the banner |
| Page loads but buttons dead / “Blocked cross-origin” in terminal | Restart `npm run dev:lan` (auto-configures `allowedDevOrigins` for your current LAN IP) |

## After the prospect demo

Ship real Supabase Auth (`feat/supabase-auth-signup`); expert creates their own account post-call.
