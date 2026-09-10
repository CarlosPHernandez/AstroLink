# API health + hardening — 2026-09-09 — `main`

Read-only audit. 53 `src/app/api/**/route.ts` handlers. No production code was changed.

**Composite code health:** 5.9 / 10 (first recorded run). Tests are green; lint and GBrain drag the score. API hardening is a separate benchmark below.

---

## Snapshot

| Signal | Result |
|--------|--------|
| Typecheck | 4 errors (all in test files) |
| Lint | 24 errors, 4 warnings |
| Unit tests | 878 passed, 1 skipped |
| Route tests | 21 of 53 routes (~40%) |
| Production 24h | 224×200, 1×404, no 5xx in sampled logs |
| Production 7d | `listPublicMentors: fetch failed` ×58 (39 users), last seen 2026-09-04 |
| `/review` | Nothing to land — already on `main` vs `origin/main` |

---

## 1. Customer experience APIs

What buyers and guests hit. Production waitlist (`APP_MODE=waitlist` + `CHRIS_BOOKING_ENABLED`) only opens a subset.

| Route | Auth | Rate limit | Tests | Notes |
|-------|------|------------|-------|--------|
| `POST /api/book` | mentee session | booking windows | yes | Zod + intake moderation |
| `POST /api/book/briefing` | participant | LLM | yes | |
| `POST /api/book/briefing/email` | participant | none extra | no | Resend on demand |
| `POST /api/book/fulfill` | session | n/a | no | Dev-only (`NODE_ENV === 'production'` → 404) |
| `POST /api/bookings/[id]/cancel` | session | cancel windows | yes | |
| `POST /api/bookings/[id]/confirm-payment` | session | — | yes | |
| `GET /api/bookings/[id]/status` | session | — | no | |
| `POST /api/chris-slot-choice` | signed token | — | yes | Ops slot picker |
| `POST /api/early-access` | public | n/a | no | Retired **410** |
| `POST /api/educator-demo` | public | **none** | no | Waitlist-blocked unless full mode |
| `POST /api/expert-reviews` | session | LLM (moderation) | yes | |
| `POST /api/landing/relay-preview` | public | IP + LLM budget | yes | Honeypot + cache |
| `POST /api/me/preferred-locale` | session | — | yes | **Waitlist-blocked** (see P1) |
| `GET /api/me/session-comp-grant` | session | — | no | **Waitlist-blocked** |
| `POST /api/path-assessment` | public | IP + email | no | Gemini report |
| `GET /api/path-assessment/[token]` | public token | — | no | Unguessable token |
| `POST /api/path-assessment/reviews` | public | in-memory IP | no | Creates Stripe PI |
| `GET /api/path-assessment/reviews/[token]` | public token | — | no | |
| `GET /api/session/[bookingId]/join-url` | participant | — | yes | Mints Daily token |
| `POST /api/session/[bookingId]/complete` | participant | — | yes | Can fire on `confirmed` before the call |
| `GET /api/session/[bookingId]/recap` | participant | — | yes | |
| `GET /api/session/[bookingId]/transcript` | participant | — | yes | |
| `POST /api/session/.../translate-segment` | participant | caption LLM | yes | |
| `POST /api/session/.../transcript/translate` | participant | LLM | no | |
| `POST /api/session/provision` | participant | — | no | |
| `POST /api/settings/billing-portal` | session | — | no | |
| `POST /api/video-requests` | public | in-memory IP/email | no | Stripe client secret |
| `GET /api/video-requests/view` | access token | — | no | |
| `GET /api/auth/session` | cookie | — | no | |

Waitlist allowlist (always): `/api/early-access`, `/api/path-assessment/*`, `/api/admin/*`, `/api/webhooks/*`.

Chris-on extra: `/api/auth/session`, `/api/book*`, `/api/bookings/*`, `/api/session/*`, `/api/chris-slot-choice`.

---

## 2. Internal AI (Gemini + reports)

LLM entry is `src/lib/llm.ts` (`LLM_PROVIDER=gemini` default). Agents, not extra HTTP routes:

| Agent / surface | Model | Used by | Audit |
|-----------------|-------|---------|-------|
| Expert match | flash | `POST /api/book` | yes |
| Briefing (APX-02) | pro | `/api/book/briefing`, book fulfill | yes |
| Session recap (APX-03) | flash | complete + Daily webhook | yes |
| Live captions (APX-06) | flash | `translate-segment` | caption scope |
| Batch transcript translate | flash | `transcript/translate` | yes |
| Path assessment report | flash | `POST /api/path-assessment` | yes |
| Landing hero relay | flash | `landing/relay-preview` | isolated budget |
| Review moderation | flash | `POST /api/expert-reviews` | yes |
| Compliance | flash/pro | admin flow | yes |
| Settlement | flash | post-session | yes |

Hardening already in place: `assertLlmRateLimit` (global + per-user + caption), `E2E_STUB_LLM` blocked on Vercel Production, `LLM_PROVIDER` required when OpenAI key is set, token budget on captions, honeypots on landing + path-assessment.

Gaps:

1. `generateStructuredJsonGemini` does `JSON.parse(response.text || '{}') as T` — no Zod after parse. Empty Gemini text becomes `{}` and can be written as a briefing/recap/assessment.
2. All LLM rate limits are **in-process Maps**. On Vercel that is per-instance. A burst across lambdas bypasses the advertised caps.
3. Path-assessment 500s return `error.message` to the client (provider strings can leak).

---

## 3. Internal APIs (ops, webhooks, dev)

| Route | Gate | Tests |
|-------|------|-------|
| `GET/POST /api/admin/*` (metrics, mentors, invite, payouts, compliance, expert-reviews, audit-logs, export, reclaim-transcript) | `requireApiRole('admin')` | mixed (export, payouts, reviews, reclaim yes; metrics/mentors/compliance no) |
| `POST /api/webhooks/stripe` | `constructEvent` + `metadata.app=astrolink` | yes |
| `POST /api/webhooks/daily` | HMAC | yes |
| `POST /api/cron/video-request-expire` | `CRON_SECRET` Bearer (500 if missing in prod NODE_ENV) | no |
| `POST /api/e2e/session` | `isDemoAuthEnabled()` else 404 | no |
| `POST /api/dev/session-operator` | `NODE_ENV === 'production'` 404 + session | no |
| `GET /api/admin/metrics` | admin | no |

Waitlist still **allows every `/api/admin/*`**. Handlers check admin session. That is correct if cookies hold; it is a larger attack surface than necessary on the public origin.

---

## 4. Expert-facing APIs

| Route | Auth | Tests |
|-------|------|-------|
| `GET /api/mentor/expert-reviews` | mentor/admin session | no |
| `GET /api/mentor/path-assessment-reviews` | mentor/admin | no |
| `POST /api/mentor/path-assessment-reviews/[id]/deliver` | mentor/admin | no |
| `POST /api/mentor/stripe-connect` | `requireApiRole('mentor')` | yes |
| `GET /api/mentor/video-requests` | mentor/admin | no |
| `GET /api/mentor/video-requests/[id]` | mentor/admin | no |
| `POST .../upload-url`, `deliver`, `decline` | mentor/admin | no |
| Shared session APIs | participant | see CX |

Pending-activation mentors are redirected by proxy, but these routes do **not** call `requireActivatedMentor`. Dashboard server actions do. Comment in `proxy.ts` says mutations use that gate — API mutations do not.

Waitlist blocks all `/api/mentor/*` (mentor dashboard is not a waitlist surface). Fine for current prod; a problem the day experts go live under waitlist.

---

## Hardening findings

| ID | Sev | Bucket | Evidence | Suggested action | Effort |
|----|-----|--------|----------|------------------|--------|
| API-1 | **P1** | CX | `isChrisBookingApiRoute` omits `/api/me/preferred-locale` and `/api/me/session-comp-grant`. Caption gate + booking client call them. Waitlist returns 404. Tests never cover these paths. | Add both to the Chris allowlist + a waitlist-route test | S |
| API-2 | **P1** | AI | `src/lib/llm.ts:242` `JSON.parse(response.text \|\| '{}') as T` with no Zod. Empty/partial Gemini JSON can persist as a recap or briefing. | Parse-fail → throw; validate with existing schemas before DB write | M |
| API-3 | **P1** | AI / CX | LLM + path-assessment + video-request + landing limits are in-memory. Serverless replicas do not share counters. | Durable limiter (Redis/Upstash or Supabase) for LLM + paid public POSTs first | M |
| API-4 | **P1** | CX | `POST /api/session/[bookingId]/complete` accepts any participant on `confirmed` with no `scheduled_at` floor. Triggers recap + settlement fallback. Tests lock this in. | Require session start window (e.g. scheduled_at − 5m) or Daily presence | S |
| API-5 | **P2** | CX | `POST /api/educator-demo` has no rate limit. `video-requests` and `path-assessment/reviews` use a local Map. | Share durable limiter; add honeypot on educator-demo | S |
| API-6 | **P2** | CX | Several handlers return `error.message` / Supabase messages (path-assessment, recap, provision, join-url 502, mentor list). | Map to stable public errors; log internals | S |
| API-7 | **P2** | Expert | Mentor mutation APIs skip `requireActivatedMentor`. | Same gate as dashboard actions | S |
| API-8 | **P2** | Tests | 32 routes have no colocated test, including money paths: video-requests, path-assessment, fulfill, cron, briefing email. | Tests for paid public POSTs + complete time-gate | M |
| API-9 | **P2** | Prod CX | `listPublicMentors` TypeError fetch failed ×58 / 7d on `/`, `/experts`, `/talk-with-chris`. Last 2026-09-04. | Retry/timeout around directory fetch; alert if it returns | S |
| API-10 | **P3** | Internal | `/api/admin/*` reachable in waitlist (auth still required). | Optional: allowlist specific admin paths | S |

Not P0. Auth on money/session routes exists. Stripe/Daily webhooks verify signatures. Demo auth and `E2E_STUB_LLM` are blocked on Vercel Production. `SKIP_STRIPE_PAYMENTS` is false when `NODE_ENV === 'production'`.

---

## Benchmark (use this to decide what to ship)

Score 0–10 per bucket. **Ship bar: every bucket ≥ 8, no open P1.**

| Dimension | Weight | CX | AI / reports | Internal | Expert |
|-----------|--------|----|--------------|----------|--------|
| Auth / access | 25% | 7 | 8 | 8 | 6 |
| Rate limit / abuse | 20% | 5 | 5 | 8 | 7 |
| Input + LLM trust | 20% | 7 | 4 | 8 | 7 |
| Tests | 20% | 6 | 6 | 6 | 3 |
| Prod / waitlist fit | 15% | 5 | 7 | 8 | 6 |
| **Bucket score** | | **6.1** | **5.9** | **7.6** | **5.7** |

How scored: 10 = production-safe and tested; 7 = happy path solid, one real gap; 4 = gap that can bite users or cost; 0 = ungated.

**Priority to gepush (gap → push):**

1. **CX 6.1 → 8:** API-1 (waitlist `/api/me/*`) + API-4 (complete time-gate) + API-9 (directory fetch).
2. **AI 5.9 → 8:** API-2 (Zod after Gemini) + API-3 (durable LLM limiter).
3. **Expert 5.7 → 8:** API-7 + route tests for video-request mutations.
4. **Internal 7.6:** hold unless touching admin; add metrics/compliance tests when next in that code.

Re-score after each PR: rerun this table, plus `npm test` and the waitlist-route unit tests. Do not treat lint 5.9 composite as the API bar.

---

## Recommended attack order

1. Waitlist allowlist for `/api/me/preferred-locale` and `/api/me/session-comp-grant` (Chris session captions + comp grant).
2. Reject empty Gemini JSON; validate structured output before write.
3. Time-gate `/api/session/[bookingId]/complete`.
4. Durable rate limits for LLM + public paid POSTs.
5. Educator-demo rate limit; stop leaking provider errors.

---

## Explicit non-goals this scan

- Rewriting agents into a new framework
- Stripe Connect restore
- Knip / dead-code sweep
- Fixing the 24 ESLint UI errors (not API)

---

## Decision ledger

| # | Finding | Disposition | Owner / next step |
|---|---------|-------------|-------------------|
| 1 | API-1 waitlist `/api/me/*` | **Needs option** | Ship a small allowlist PR now, or confirm prod `APP_MODE=full` so it is moot |
| 2 | API-2 Gemini JSON as T | **Needs option** | Zod in `llm.ts` vs per-agent parse |
| 3 | API-3 in-memory limits | **Deferred** | Needs a store choice (Upstash vs Supabase). Trigger: first paid public abuse or caption bill spike |
| 4 | API-4 complete too early | **Needs option** | Time-gate vs Daily participant check |
| 5 | API-5–8 | **Deferred** | After P1 choices |
| 6 | API-9 directory fetch | **Deferred** | Watch 7d errors; last event 2026-09-04 |
| 7 | Lint 24 / tsc 4 (tests) | **Deferred** | Not this API pass |
| 8 | Persist Health Stack in CLAUDE.md | **Rejected** | User asked for API health, not CI config |

**Session outcome:** report only. No code changes.

---

## Engineering discipline closeout

**Decisions:** 0 accepted, 1 rejected, 3 deferred, 3 need option  
**Tests:** none added (report-only)  
**Simplification:** none — justify: inventory + allowlist shrink is the simplify; no new routes recommended  
**Next action:** pick API-1 vs “prod is full mode” so the Chris caption gate is not 404 in waitlist
