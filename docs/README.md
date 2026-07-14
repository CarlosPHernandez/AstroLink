# AstroLink documentation

Structured using [Diataxis](https://diataxis.fr/): tutorials teach, how-tos guide tasks, reference lists facts, explanations give context.

## Product & roadmap

| Doc | Quadrant | Audience |
|-----|----------|----------|
| [d1-implementation-plan.md](./d1-implementation-plan.md) | Explanation (status) | Engineers, demo prep |
| [d2-next-steps.md](./d2-next-steps.md) | Explanation (roadmap) | Product + engineering |
| [d3-transcript-translation-roadmap.md](./d3-transcript-translation-roadmap.md) | Explanation (roadmap) | Product + engineering — bilingual expert sessions |

**Public expert discovery:** Landing teaser + full roster at `/experts` (0.1.6.0) and `/experts/[slug]` profile pages (0.1.4.2). Entry points: README D1 flow, CHANGELOG, and "Expert profile v1" in [d2-next-steps.md](./d2-next-steps.md).

## Video sessions (Daily.co)

| Doc | Quadrant | Description |
|-----|----------|-------------|
| [tutorial/first-video-session.md](./tutorial/first-video-session.md) | Tutorial | First local video call from install to recap |
| [tutorial/bidirectional-live-captions.md](./tutorial/bidirectional-live-captions.md) | Tutorial | Two-device bidirectional live captions + post-call transcript |
| [how-to/video-session-demo.md](./how-to/video-session-demo.md) | How-to | Investor demo runbook, cheatsheet, dev operator |
| [how-to/daily-live-account-guardrails-plan.md](./how-to/daily-live-account-guardrails-plan.md) | How-to | Live Daily account quota guardrails and demo approval plan |
| [reference/video-session.md](./reference/video-session.md) | Reference | APIs, gates, env vars, module map |
| [explanation/video-session-architecture.md](./explanation/video-session-architecture.md) | Explanation | Why private rooms, tokens, and webhooks |

## Transcript translation (D3 wedge)

| Doc | Quadrant | Description |
|-----|----------|-------------|
| [d3-transcript-translation-roadmap.md](./d3-transcript-translation-roadmap.md) | Explanation | D3 roadmap — Phases 1–3 shipped (capture, localized recap, bidirectional live captions + post-call transcript); Phase 4 moat next |
| [explanation/transcript-translation-architecture.md](./explanation/transcript-translation-architecture.md) | Explanation | Canonical English, Daily STT, APX-06 translation layer |
| [explanation/transcript-translation-engineering-review.md](./explanation/transcript-translation-engineering-review.md) | Explanation | Token budgets, eng decisions, cost model |
| [explanation/live-caption-rate-limits.md](./explanation/live-caption-rate-limits.md) | Explanation | Caption LLM scope, queue cap, pause banner, sustained-speech cost |
| [explanation/transcript-translation-ai-sdk-review.md](./explanation/transcript-translation-ai-sdk-review.md) | Explanation | Vercel AI SDK fit vs extending `llm.ts` |
| [explanation/transcript-translation-case-studies.md](./explanation/transcript-translation-case-studies.md) | Explanation | Zoom, Teams, Meet, telehealth — differentiation |

Agent skill: `skills/transcript-translation/SKILL.md` · Cursor rule: `.cursor/rules/transcript-translation.mdc`

## Chris Sembroski campaign (go-live)

| Doc | Quadrant | Description |
|-----|----------|-------------|
| [how-to/chris-campaign-launch-checklist.md](./how-to/chris-campaign-launch-checklist.md) | How-to | Production env, dual pricing ($180 early / $200 public), July 20 earliest date, smoke tests |
| [how-to/chris-early-waitlist-email-automation.md](./how-to/chris-early-waitlist-email-automation.md) | How-to | Pre-booking Resend waitlist sequence templates and exit rules |
| [how-to/marketing-referrer-taxonomy.md](./how-to/marketing-referrer-taxonomy.md) | How-to | `ref` values including `early-signups`, `chris-social`, `chris-sembroski` |
| [how-to/stripe-production-cutover.md](./how-to/stripe-production-cutover.md) | How-to | Live Stripe keys, webhook, first real charge |
| [plans/chris-sembroski-launch.md](./plans/chris-sembroski-launch.md) | Explanation | Original PR1–PR4 launch stack (pre-ship spec; prefer how-tos for ops) |

**Pricing SOOT:** `src/lib/chris-campaign/chris-pricing.ts` — server charges from `marketing_referrer`, never client amount.

## Team ops (3-person)

| Doc | Quadrant | Description |
|-----|----------|-------------|
| [how-to/weekly-ops-slack-template.md](./how-to/weekly-ops-slack-template.md) | How-to | Monday #astrolink-ops post after Canvas refresh |
| [how-to/marketing-referrer-taxonomy.md](./how-to/marketing-referrer-taxonomy.md) | How-to | `ref` values for /early-access attribution |

Cursor canvases (Carlos refreshes): `weekly-team-brief`, `sales-pipeline`, `marketing-funnel`, `mentor-dashboard-ops` (PR1–PR5 before/after + CEO translations) under the workspace `canvases/` directory.

## Mentor dashboard ops (shipped v0.5.0.0)

| Doc | Quadrant | Description |
|-----|----------|-------------|
| [plans/mentor-dashboard-ops.md](./plans/mentor-dashboard-ops.md) | Explanation | PR1–PR5 stack, decision ledger, north-star journey |
| [how-to/mentor-dashboard-payouts-plan.md](./how-to/mentor-dashboard-payouts-plan.md) | How-to | Earnings, manual payouts, Connect flag |

Cursor canvas: `mentor-dashboard-ops` — CTO → CEO → mentor language for all five PRs.

## Plans (pre-ship specs)

| Doc | Notes |
|-----|--------|
| [plans/early-access-redesign.md](./plans/early-access-redesign.md) | Waitlist landing redesign spec |
| [plans/david-guajardo-partner-landing.md](./plans/david-guajardo-partner-landing.md) | `/join/[slug]` partner pages |
| [plans/chris-sembroski-launch.md](./plans/chris-sembroski-launch.md) | Chris campaign launch stack (PR1–PR4); PR2.5 mobile landing shipped v0.5.7.0 |
| [plans/mentor-dashboard-ops.md](./plans/mentor-dashboard-ops.md) | Shipped — retained as decision record |

These are design/planning artifacts — not canonical runbooks. Prefer `how-to/` and `reference/` for ops.

## Other

| Doc | Notes |
|-----|--------|
| [astrolink-one-page-sales-sheet.md](./astrolink-one-page-sales-sheet.md) | GTM one-pager (not engineering) |
