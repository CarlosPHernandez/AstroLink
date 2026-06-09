---
name: transcript-translation
description: >-
  Guides agents implementing AstroLink transcript capture, translation, and
  localized recap for live expert sessions. Covers Daily transcription hooks,
  token-budgeted translation, aerospace glossary, and integration with APX-03.
---

# Transcript Translation

## Overview

AstroLink connects buyers with aerospace experts across language barriers. This skill covers the **D3 wedge**: bilingual session access without sacrificing technical accuracy or compliance audit trails.

**Canonical docs (read before coding):**

| Doc | Purpose |
|-----|---------|
| [d3-transcript-translation-roadmap.md](../../docs/d3-transcript-translation-roadmap.md) | Phased product roadmap |
| [transcript-translation-architecture.md](../../docs/explanation/transcript-translation-architecture.md) | System design |
| [transcript-translation-engineering-review.md](../../docs/explanation/transcript-translation-engineering-review.md) | Token optimization, eng decisions |
| [transcript-translation-ai-sdk-review.md](../../docs/explanation/transcript-translation-ai-sdk-review.md) | AI SDK fit assessment |
| [transcript-translation-case-studies.md](../../docs/explanation/transcript-translation-case-studies.md) | Competitive landscape |

## Dependencies

- `mobile-first-design-practices` — live caption overlay and recap UI on 320px viewports.
- Existing `src/lib/llm.ts` — structured JSON and flash/pro model tiers (do **not** add AI SDK for D3 Phase 0–2 without eng review).

## Current state (v0.1.5.0)

- **Phase 1:** `session_transcripts` populated from Daily WebVTT; APX-03 receives truncated English window.
- **Phase 2:** `users.preferred_locale`; APX-06 recap translation; `GET /api/session/[id]/recap?locale=`.
- **Phase 3:** `DailyCallRoom` (`createCallObject`), `use-live-captions`, `CaptionRail`, `POST /api/session/[bookingId]/translate-segment`, LRU segment cache, mentor captions indicator.

## Architecture principles

1. **Canonical English in DB** — Store source transcript and LLM synthesis in English. Translate at read-time or in a derived `session_translations` table. Keeps audit_log and XPRIZE evidence in one language.
2. **Segment, don't monolith** — Translate WebVTT/utterance segments (≤ 500 tokens each), not full 60-minute transcripts in one LLM call.
3. **Glossary-first** — Inject aerospace terms (`ITAR`, `GEO`, `RPO`, program names) via `AEROSPACE_GLOSSARY` before generic translation.
4. **Two speeds** — Live captions: streaming, flash model, ~1–2 s latency budget. Post-session recap: async, batch segments, pro optional for summary only.
5. **Idempotent hooks** — Translation jobs keyed by `(booking_id, segment_id, target_locale)`; safe to retry after `meeting.ended`.

## Repo map

| Area | Path |
|------|------|
| Types & constants | `src/lib/transcript-translation/` |
| Post-session hook | `src/lib/post-session.ts` |
| Synthesis agent | `src/services/agents/session-agent.ts` |
| Session UI | `src/app/session/[bookingId]/session-room-client.tsx` |
| Call object + captions | `src/components/session/` (`daily-call-room`, `use-live-captions`, `caption-rail`) |
| Segment translate API | `src/app/api/session/[bookingId]/translate-segment/route.ts` |
| Segment lib + cache | `src/lib/transcript-translation/translate-segment.ts`, `segment-cache.ts` |
| Daily integration | `src/lib/daily.ts`, `daily-transcription.ts` |
| LLM core | `src/lib/llm.ts` |

## Implementation workflow

### Phase 1 — Capture (no translation yet)

1. Enable Daily transcription on domain (`enable_transcription`).
2. After payment provision, set `auto_start_transcription` on meeting tokens for mentors.
3. On `meeting.ended`, fetch WebVTT via Daily REST API → persist `session_transcripts` (migration in roadmap).
4. Pass real transcript (truncated per token budget) to `SessionAgent.synthesizeSession`.

### Phase 2 — Post-session translation ✅ shipped

1. `users.preferred_locale` on mentee profile (settings server action; BCP-47, default `en`).
2. After APX-03, `maybeRunTranslationIfNeeded()` runs APX-06 inline when English `summary_json` exists and mentee locale ≠ `en` (also on transcription-disabled `meeting.ended` path).
3. `session_translations.summary_json` per `target_locale`; `GET /api/session/[bookingId]/recap` resolves locale server-side (`recap-locale.ts`); session room polls without `?locale=`.
4. Checkout locale picker remains **Phase 2b** — not in this slice.

### Phase 3 — Live translated captions ✅ shipped

1. `createCallObject()` replaces iframe; `transcription-message` → `translate-segment` API.
2. Per-booking LRU segment cache (`segment-cache.ts`); server enforces mentee `preferred_locale`.
3. `CaptionRail` for mentee; mentor sees `session-captions-indicator` when buyer locale ≠ `en`.

## Token optimization checklist

Before any LLM call on transcript text:

- [ ] Run `estimateTranscriptTokens()` and `selectTranscriptWindow()` from `token-budget.ts`.
- [ ] Strip filler / backchannel ("um", "you know") for synthesis input only — keep raw for compliance.
- [ ] Deduplicate repeated segments (network re-delivery).
- [ ] Use `llmFlashModel` for translation; reserve `llmProModel` for APX-03 synthesis.
- [ ] Cap live translation to last N utterances in prompt context (default 8).
- [ ] Log `prompt_tokens` / `segment_count` to `audit_log` for cost tracking.

## Prompt pattern (segment translation)

```text
System: You translate aerospace expert session dialogue. Preserve technical terms
from the glossary verbatim. Output only the translation, no commentary.

Glossary: {glossary_json}

User: Source ({source_locale}): {segment_text}
Target: {target_locale}
```

## Testing

- Unit: `token-budget.ts` window selection, glossary term preservation mocks.
- Contract: `translateSegment` returns stable output for E2E stub (`E2E_STUB_LLM=true`).
- E2E Phase 2: `e2e/localized-recap.spec.ts` — book → `simulate_meeting_ended` → assert `[pt-BR]` recap stub.
- E2E Phase 3: `e2e/live-captions.spec.ts` — stubbed translate-segment + caption rail assertions.

## Do not

- Store only translated text without English canonical — breaks moderation and XPRIZE audit.
- Send full 60-min transcript to APX-03 — use `selectTranscriptWindow()` (see engineering review).
- Add `@ai-sdk/*` packages in Phase 0–2 without updating the AI SDK review doc.
- Auto-translate intake or payment flows in v1 — scope is **in-session + recap** only.

## Related agents

| Agent | Role with translation |
|-------|----------------------|
| APX-03 SessionAgent | Consumes English transcript window for synthesis |
| APX-04 ComplianceAgent | D2+: moderate English canonical transcript |
| APX-06 TranslationAgent | Post-session recap translation (`session_translations`) |
