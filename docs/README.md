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
| [how-to/video-session-demo.md](./how-to/video-session-demo.md) | How-to | Investor demo runbook, cheatsheet, dev operator |
| [how-to/daily-live-account-guardrails-plan.md](./how-to/daily-live-account-guardrails-plan.md) | How-to | Live Daily account quota guardrails and demo approval plan |
| [reference/video-session.md](./reference/video-session.md) | Reference | APIs, gates, env vars, module map |
| [explanation/video-session-architecture.md](./explanation/video-session-architecture.md) | Explanation | Why private rooms, tokens, and webhooks |

## Transcript translation (D3 wedge)

| Doc | Quadrant | Description |
|-----|----------|-------------|
| [d3-transcript-translation-roadmap.md](./d3-transcript-translation-roadmap.md) | Explanation | D3 roadmap — Phases 1–3 shipped (capture, localized recap, live captions); Phase 4 moat next |
| [explanation/transcript-translation-architecture.md](./explanation/transcript-translation-architecture.md) | Explanation | Canonical English, Daily STT, APX-06 translation layer |
| [explanation/transcript-translation-engineering-review.md](./explanation/transcript-translation-engineering-review.md) | Explanation | Token budgets, eng decisions, cost model |
| [explanation/transcript-translation-ai-sdk-review.md](./explanation/transcript-translation-ai-sdk-review.md) | Explanation | Vercel AI SDK fit vs extending `llm.ts` |
| [explanation/transcript-translation-case-studies.md](./explanation/transcript-translation-case-studies.md) | Explanation | Zoom, Teams, Meet, telehealth — differentiation |

Agent skill: `skills/transcript-translation/SKILL.md` · Cursor rule: `.cursor/rules/transcript-translation.mdc`

## Team ops (3-person)

| Doc | Quadrant | Description |
|-----|----------|-------------|
| [how-to/weekly-ops-slack-template.md](./how-to/weekly-ops-slack-template.md) | How-to | Monday #astrolink-ops post after Canvas refresh |
| [how-to/marketing-referrer-taxonomy.md](./how-to/marketing-referrer-taxonomy.md) | How-to | `ref` values for /early-access attribution |

Cursor canvases (Carlos refreshes): `weekly-team-brief`, `sales-pipeline`, `marketing-funnel` under the workspace `canvases/` directory.

## Other

| Doc | Notes |
|-----|--------|
| [astrolink-one-page-sales-sheet.md](./astrolink-one-page-sales-sheet.md) | GTM one-pager (not engineering) |
