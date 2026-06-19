# Waitlist production checklist

Use before and after pointing marketing traffic at `/early-access`.

## Vercel Production environment variables

| Variable | Production value |
|----------|------------------|
| `APP_MODE` | `waitlist` |
| `ENABLE_DEMO_AUTH` | `false` |
| `ENCRYPTION_KEY` | 32-byte hex (`openssl rand -hex 32`) |

The production build **fails** if `VERCEL_ENV=production` and `ENABLE_DEMO_AUTH=true` or `ENCRYPTION_KEY` is missing.

## Supabase migration

Apply `supabase/migrations/20260619120000_early_access_rate_limits.sql` on the hosted project so signup rate limits work across all Vercel instances. Until applied, the API falls back to in-memory limits per lambda.

## Vercel Firewall (recommended)

In **Vercel → Project → Firewall**, add a rate limit rule:

- **Path:** `POST /api/early-access`
- **Limit:** ~10 requests / minute / IP (tune after first campaign)

This is the first line of defense before app-level limits.

## Smoke test after deploy

1. `GET /api/early-access` → `405`
2. Valid signup → `200` + uniform success message
3. Rapid repeat from same IP → `429` with `Retry-After`
4. `GET /dashboard/admin` without session → redirect to `/early-access`
5. Response headers include `X-Frame-Options: DENY`