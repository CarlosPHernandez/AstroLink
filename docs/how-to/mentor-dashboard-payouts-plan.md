# Mentor dashboard — earnings & payouts plan

**Last updated:** 2026-06-22
**Scope:** Mentor dashboard earnings, manual payouts at launch, optional Connect restore. **PR1–PR5 shipped** (v0.4.7.0 → v0.5.0.0). See [mentor-dashboard-ops plan](../plans/mentor-dashboard-ops.md) and Cursor canvas `mentor-dashboard-ops`.

## Problem

The mentor dashboard sidebar and copy read like generic AI output: excessive mono/uppercase labels, colored status dots, gradient name text, and jargon (“telemetry briefings”, “flight profile”). Payouts are simulated client-side (`setTimeout`) instead of using existing `ComplianceAgent` + Stripe Connect. Mentors have no view of earned vs pending vs paid amounts despite `transactions` rows written by APX-05.

## Goals

| Goal | Outcome |
|------|---------|
| **G1** — Navigation cleanup | Sidebar matches mentee dashboard tone: plain labels, no decorative dots, readable hierarchy |
| **G2** — Earnings groundwork | Server-side aggregation from `transactions` + booking context; summary cards + ledger table |
| **G3** — Stripe Connect | `/api/mentor/stripe-connect` creates account link or Express dashboard login; no client simulation |
| **G4** — Webhook infrastructure | Extend `/api/webhooks/stripe` for `account.updated`, `payout.paid` (audit + future payout sync) |
| **G5** — Compliance prompts | Tighter APX-04 bio scan + NF-1860 instructions (structured, auditable) |

## Stripe integration (Connect marketplace)

Per [Stripe Connect best practices](https://docs.stripe.com/connect/saas-platforms-and-marketplaces.md):

| Decision | Choice | Notes |
|----------|--------|-------|
| Charge type | **Destination charges** | Already shipped: `transfer_data.destination` + `application_fee_amount` on PaymentIntent (`booking-agent.ts`) |
| Connected account API | **v1 Express (existing)** | `ComplianceAgent` provisions `type: 'express'`. Migrate to Accounts v2 (`POST /v2/core/accounts`) in a follow-up — not blocking this UI pass |
| Payout visibility | **Express Dashboard login link** | Mentors view bank payouts in Stripe; we surface summary from our `transactions` ledger |
| Webhooks (required today) | `payment_intent.*` | Already handled → APX-05 escrow |
| Webhooks (groundwork) | `account.updated`, `payout.paid` | Sync `stripe_onboarding_completed`; audit payout events for future `mentor_payouts` table |
| Security | Signature verify + env secrets | `STRIPE_WEBHOOK_SECRET`; never log keys; use RAK in production |

**Do not** add `payment_method_types` on new Checkout/PI calls (dynamic payment methods).

## Data model

**Transactions** (`public.transactions`) — earnings source of truth:

- `pending` — payment authorized, escrow not captured
- `completed` — capture succeeded after session
- `failed` — payment or capture failed

**Manual payouts** (PR2, shipped):

- `mentor_manual_payouts` — batch header when ops marks paid
- `mentor_payout_lines` — one row per `transaction_id` (idempotent)

Future: Stripe `payout.*` webhook mirror — manual lines remain source of truth until then.

## Implementation tasks

| Task | Status | Files |
|------|--------|-------|
| **T1** — `mentor-earnings.ts` aggregation | Done | `src/lib/mentor-earnings.ts`, tests |
| **T2** — Stripe Connect API route | **Done (PR5)** | Restored behind `ENABLE_STRIPE_CONNECT_PAYOUTS`; 503 when off. Lib: `src/lib/mentor-stripe-connect.ts` |
| **T3** — Dashboard UI refactor | Done | `mentor-dashboard-client.tsx`, panel components |
| **T4** — Webhook groundwork | Done | `src/app/api/webhooks/stripe/route.ts` |
| **T5** — APX-04 prompt polish | Done | `compliance-agent.ts` |
| **T6** — Vitest for earnings math | Done | `mentor-earnings.test.ts` |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | **complete** | Reuse `transactions`; no new migration; Connect API stays server-only |
| Design Review | `/plan-design-review` | Nav slop removal | 1 | **complete** | Align with mentee dashboard; single “Earnings & payouts” tab |
| CEO Review | `/plan-ceo-review` | Scope | 0 | — | In scope for D2 mentor ops |
| Codex Review | `/codex review` | 2nd opinion | 0 | — | Not run |

**VERDICT:** Shipped — PR1–PR5 on main. Manual payouts at launch; Connect flag-gated; Stripe payout webhook mirror still deferred.

## Decision ledger

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Earnings from `transactions`, not live Stripe Balance API | Matches escrow/capture model; works in skip-Stripe dev |
| 2 | Keep v1 Express accounts | Avoid breaking `ComplianceAgent` in this pass |
| 3 | Merge earnings + bank into one tab | Reduces nav noise after slop cleanup |
| 4 | `account.updated` webhook updates `stripe_onboarding_completed` | Single source for Connect readiness |
| 5 | Manual payouts at launch; Connect behind `ENABLE_STRIPE_CONNECT_PAYOUTS` | Avoids broken Connect CTA while route is stubbed |

## Test ledger

| Test | Command | Covers |
|------|---------|--------|
| Earnings aggregation | `npm test mentor-earnings` | Summary buckets, row mapping |
| Stripe webhook | `npm test stripe` (if exists) | Existing PI handlers unchanged |
| Manual demo | `npm run dev` → `/dashboard/mentor` as Chris | Nav, earnings empty state, manual payouts card |
| Mentor dashboard E2E | `npm run test:e2e -- e2e/mentor-dashboard.spec.ts` | Tabs, manual payouts (no Connect CTA), profile + NF-1860 |

## Simplification

- Removed client-side Stripe simulation and fake `stripe_acct_active` id
- Removed sidebar colored dots and gradient welcome text
- Fee calculator kept; copy shortened to plain language
