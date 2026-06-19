# Waitlist / early-access domain

Server and client helpers for `/early-access`, `/join/[slug]`, and `/api/early-access`.

| Module | Role |
|--------|------|
| `early-access-schema.ts` | Zod body for signup POST |
| `early-access-rate-limit.ts` | IP/email rate limits |
| `early-access-referrer.ts` | Parse `?ref=` from landing URLs |
| `early-access-success.ts` | Success copy (new vs duplicate signup) |
| `waitlist-routes.ts` | `APP_MODE=waitlist` public path allowlist |
| `waitlist-roster-order.ts` | Featured expert + roster sort |
| `waitlist-analytics.ts` | Vercel custom events |
| `admin-waitlist-metrics.ts` | Ops dashboard signup metrics |

UI lives in `src/components/early-access/`; routes in `src/app/early-access/` and `src/app/join/`.