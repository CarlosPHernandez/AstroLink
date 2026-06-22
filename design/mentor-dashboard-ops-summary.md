# Mentor Dashboard Ops — Product Summary

**AstroLink · v0.4.7.0 → v0.5.0.0 · PRs #47–#51 · June 2026**

---

## Executive summary

AstroLink’s mentor dashboard now tells the truth about money, tracks every bank transfer, shows directory visibility, reads cleanly on mobile, and can flip to Stripe Connect when ops is ready — without another engineering sprint.

| Audience | One-line outcome |
|----------|------------------|
| **Engineering (CTO)** | Five PRs closed the mentor money/listing/Connect loop: truthful ledger, idempotent manual payout lines, listing visibility, stacked UI, Connect API behind one env flag. |
| **Business (CEO)** | Mentors see accurate earnings; ops pays without spreadsheets; experts know if they’re live; flip one env var for automated payouts when ready. |
| **Mentor (user)** | Earnings shows earned / awaiting / transferred; Profile shows public URL and blockers; Transfer updates when ops pays me. |

---

## North star — per-booking mentor journey

1. **Payment recorded** (PR1) — transaction `completed` → Recorded share on Earnings
2. **Session complete** — booking status on ledger row
3. **Transfer** (PR2) — ops mark-paid → `mentor_payout_lines` → Transferred
4. **Public listing** (PR3) — compliance + `is_listed` + preview on Profile
5. **Connect optional** (PR5) — Stripe Express when `ENABLE_STRIPE_CONNECT_PAYOUTS=true`

Steps 1–4 are live in production. Step 5 restores code behind an env flag. Manual payout lines remain source of truth until Stripe payout webhooks ship.

---

## Before vs after

Baseline: **v0.4.6.0** (pre-stack). Shipped: **v0.5.0.0**.

| Area | Before (v0.4.6.0) | After (v0.5.0.0) |
|------|-------------------|------------------|
| Earnings summary | “Pending capture” / “Paid out” — misleading for immediate-capture | Recorded share · Awaiting transfer · Transferred |
| Per-session money | Payment column only; refunds inflated totals | Payment + Transfer columns; refunds excluded |
| Ops payouts | Spreadsheets outside product | Admin mark-paid + `mentor_payout_lines` audit trail |
| Directory | No in-dashboard listing state | Public listing card + preview when live |
| Layout | Squeezed side-by-side on md+ screens | Stacked cards — goals/context full width |
| Stripe Connect | API returned 503 | Restored behind env flag; manual still default |

---

## PR1 — Earnings truthfulness

**v0.4.7.0 · PR #47**

### Before

Summary cards said “Pending capture” and “Paid out” — wrong for immediate-capture at booking. Refunded rows still counted toward totals.

### After

Cards: **Recorded share** · **Awaiting transfer** · **Transferred**. Ledger **Payment** column per row (Recorded / Refunded / Pending / Failed). Refunds excluded from totals.

### CTO / engineering

`summarizeMentorEarnings` buckets match escrow reality; `refundedPayoutCents` tracked separately. Ops guardrails, skills, and plan docs under `docs/plans/mentor-dashboard-ops/`.

### CEO / business

Mentors trust the numbers on screen — fewer “where’s my money?” tickets. Finance sees the same ledger mentors see. Foundation for paying 50+ experts without spreadsheet chaos.

### Mentor / user-facing

On Earnings: I see what I’ve earned, what’s waiting for a bank transfer, and what’s already paid — with no phantom money from refunds.

---

## PR2 — Manual payouts + transfer tracking

**v0.4.8.0 · PR #48**

### Before

Ops paid mentors outside the product (spreadsheets). No per-session transfer state in the dashboard.

### After

`mentor_manual_payouts` + `mentor_payout_lines` (idempotent `transaction_id`). Admin mark-paid API + **Mentor payouts** panel on `/dashboard/admin`. Ledger **Transfer** column: Awaiting / Transferred.

### CTO / engineering

Admin `GET/POST /api/admin/mentor-payouts` with audit log. `mentor-manual-payouts.ts` reconciles `awaitingTransferCents` vs `transferredCents` from payout lines.

### CEO / business

Each completed session has an auditable paid/unpaid state. Carlos can mark bank transfers in admin without exporting CSVs. Scales manual payouts at launch.

### Mentor / user-facing

Transfer column flips from Awaiting to Transferred after ops sends my share — I don’t have to email to ask if I got paid.

---

## PR3 — Public listing visibility

**v0.4.9.0 · PR #49**

### Before

Mentors couldn’t see directory listing state, public slug, or compliance blockers from the dashboard.

### After

Profile tab **Public listing** card: compliance status, `is_listed`, public URL, preview link when live. Shared `mentor-listing-status.ts` helpers.

### CTO / engineering

Dashboard loads `slug` + `is_listed` from `mentors` row. Header compliance label uses same helper. E2E asserts Chris seed on `/experts/chris-sembroski`.

### CEO / business

Experts self-serve “am I live on the site?” — faster path from approved → listed. Sales can point mentors to one screen instead of Slack pings.

### Mentor / user-facing

Profile tells me if I’m on the expert directory, my public link, and exactly what’s blocking me from going live.

---

## PR4 — UI flex sweep (stacked cards)

**v0.4.10.0 · PR #50**

### Before

Consultation cards and civil-servant row used side-by-side columns on md+ — goals, context, and NF-1860 copy got squeezed.

### After

Mobile-first stacked layout: full-width goals/context, join CTA on its own row, human-readable booking badges. Civil-servant explanation full-width below checkbox.

### CTO / engineering

`mentor-consultation-card.tsx` + civil servant row in `mentor-dashboard-client.tsx`. No data-model changes.

### CEO / business

Dashboard looks professional on phone and laptop. Mentors actually read session prep and compliance instructions — less onboarding friction.

### Mentor / user-facing

Upcoming sessions show my goals and context clearly; the civil-servant checkbox isn’t crammed into a narrow column.

---

## PR5 — Stripe Connect restore (flag-gated)

**v0.5.0.0 · PR #51**

### Before

`POST /api/mentor/stripe-connect` returned 503. Connect CTAs hidden; manual payouts only.

### After

Route restored when `ENABLE_STRIPE_CONNECT_PAYOUTS=true`: `onboard` (account link) + `dashboard` (Express login). Launch default unchanged — flag off → 503 + manual payouts message.

### CTO / engineering

Env gate in route + existing `isStripeConnectPayoutsEnabled()` UI gate. `dev_skip` when `SKIP_STRIPE_PAYMENTS`. Unit tests for 503, onboard, dashboard, and error paths.

### CEO / business

Flip one env var when ready for automated bank payouts — no redeploy of payout logic. Launch stays manual (lower ops risk). Connect is an upgrade path, not a launch blocker.

### Mentor / user-facing

Today: ops pays me manually and I track it in Transfer. When Connect is on: I can link my bank and open Stripe’s payout dashboard from AstroLink.

---

## Launch knobs (environment flags)

| Variable | Value | Behavior |
|----------|-------|----------|
| `ENABLE_STRIPE_CONNECT_PAYOUTS` | `false` (launch) | 503 on Connect API; manual payouts card; UI hides Connect CTAs |
| `ENABLE_STRIPE_CONNECT_PAYOUTS` | `true` (preview/staging) | Onboard + Express dashboard links; respects `SKIP_STRIPE_PAYMENTS` |
| `SKIP_STRIPE_PAYMENTS` | `true` (local/E2E) | No live Stripe calls; Connect returns `dev_skip` when flag enabled |

**Production launch:** keep Connect off. **Preview/staging:** enable flag with sandbox Stripe keys only. Never put live Stripe keys in `.env.local` or Preview.

---

## Manual payout ops flow (launch default)

| Who | Action | System effect |
|-----|--------|---------------|
| Mentee | Books + pays | Transaction `completed` → PR1 Recorded share |
| Both | Complete video session | Booking status on ledger row |
| Ops (admin) | Open `/dashboard/admin` → Mentor payouts | Lists unpaid sessions per mentor |
| Ops | Mark paid (batch) | Inserts `mentor_payout_lines`; mentor sees Transferred |
| Mentor | Checks Earnings tab | Awaiting → Transferred without email chase |

---

## Consciously deferred (not bugs)

- **Stripe payout webhook mirror** — manual lines stay source of truth (decision #11).
- **Connect + manual in same release** — Connect deferred to PR5 behind flag (decision #6).
- **Accounts v2 migration** — Express v1 via ComplianceAgent unchanged.

---

## Canonical docs and code map

| Artifact | Path |
|----------|------|
| Eng plan + decision ledger | `docs/plans/mentor-dashboard-ops.md` |
| Implementation README | `docs/plans/mentor-dashboard-ops/README.md` |
| Original payouts how-to | `docs/how-to/mentor-dashboard-payouts-plan.md` |
| Earnings math | `src/lib/mentor-earnings.ts` |
| Manual payouts | `src/lib/mentor-manual-payouts.ts` |
| Listing helpers | `src/lib/mentor-listing-status.ts` |
| Connect API | `src/app/api/mentor/stripe-connect/route.ts` |
| Agent skills | `.grok/skills/mentor-dashboard-ops*` |
| Cursor canvas | `mentor-dashboard-ops.canvas.tsx` (workspace `canvases/`) |
| Changelog | `CHANGELOG.md` entries 0.4.7.0–0.5.0.0 |

---

## PR stack reference

| PR | Version | GitHub | Title |
|----|---------|--------|-------|
| PR1 | v0.4.7.0 | #47 | Earnings truthfulness |
| PR2 | v0.4.8.0 | #48 | Manual payouts + Transfer column |
| PR3 | v0.4.9.0 | #49 | Public listing visibility |
| PR4 | v0.4.10.0 | #50 | UI flex sweep |
| PR5 | v0.5.0.0 | #51 | Stripe Connect restore |