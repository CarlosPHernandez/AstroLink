# Dual-device video demo (tomorrow)

Use two networks/devices so mentee and mentor are different participants in Daily.

## Accounts

| Device | Email | Role |
|--------|--------|------|
| Phone (cellular or guest Wi‑Fi) | `carlos@astrolink.ai` | Mentee |
| Computer | `carlosphernandez2020@gmail.com` | Mentor (demo) |
| Backup listed expert | `chris@astrolink.ai` | Mentor (seed; optional) |

Password on `/auth`: any string **6+ characters** (demo auth does not verify passwords).

## Env (local)

```bash
APP_MODE=full
ENABLE_DEMO_AUTH=true
SKIP_STRIPE_PAYMENTS=true
```

## Database

Apply migration `supabase/migrations/20260605120000_seed_carlos_demo_mentor.sql` on project `vwoizjesyyygmokfqpyy` (Supabase SQL editor or `supabase db push`).

## Script (~15 min)

1. Start app: `npm run dev` → http://127.0.0.1:3000
2. **Phone:** Sign in as `carlos@astrolink.ai` → `/booking?mentor=carlos-hernandez` → book live session → open session link when gate allows join.
3. **Computer:** Sign in as `carlosphernandez2020@gmail.com` → open the **same** `/session/[bookingId]` URL → both enter video.
4. Optional: repeat with Chris slug `chris-sembroski` if needed.

## After the prospect demo

Ship real Supabase Auth (`feat/supabase-auth-signup`); expert creates their own account post-call.
