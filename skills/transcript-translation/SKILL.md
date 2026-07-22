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
| [daily-transcription-storage-incident.md](../../docs/explanation/daily-transcription-storage-incident.md) | **Required reading:** live captions ≠ stored WebVTT (2026-07-21 data loss) |
| [daily-transcription-storage-preflight.md](../../docs/how-to/daily-transcription-storage-preflight.md) | Ops preflight: access-link + `session_transcripts` proof |

## Dependencies

- `mobile-first-design-practices` — live caption overlay and recap UI on 320px viewports.
- Existing `src/lib/llm.ts` — structured JSON and flash/pro model tiers (do **not** add AI SDK for D3 Phase 0–2 without eng review).

## Current state (v0.2.0.0)

- **Phase 1:** `session_transcripts` populated from Daily WebVTT; APX-03 receives truncated English window.
- **Phase 2:** `users.preferred_locale`; APX-06 recap translation; `GET /api/session/[bookingId]/recap` resolves locale server-side.
- **Phase 3 (bidirectional):** `DailyCallRoom` with Daily `multi` + `nova-3` transcription; `resolve-speaker`, `caption-direction`, and `translation-queue`; both participants see captions in their preferred locale via `translate-segment`; `CaptionRail` below video; mentor captions indicator; graceful pause on `rate_limited` / `budget_exceeded`.
- **Phase 3b (post-call transcript):** `GET /api/session/[bookingId]/transcript`, `POST .../transcript/translate`, `SessionTranscriptPanel` with localized toggle after `completed`.

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
| Speaker + direction + queue | `resolve-speaker.ts`, `caption-direction.ts`, `translation-queue.ts` |
| Batch post-call translate | `batch-translate.ts` |
| Post-session hook | `src/lib/post-session.ts` |
| Synthesis agent | `src/services/agents/session-agent.ts` |
| Session UI | `src/app/session/[bookingId]/session-room-client.tsx` |
| Call object + captions | `src/components/session/` (`daily-call-room`, `use-daily-call`, `use-live-captions`, `caption-rail`, `session-transcript-panel`) |
| Segment translate API | `src/app/api/session/[bookingId]/translate-segment/route.ts` |
| Transcript APIs | `src/app/api/session/[bookingId]/transcript/` (GET + POST translate) |
| Join URL helper | `src/app/api/session/[bookingId]/join-url/route.ts`, `src/lib/daily-join-url.ts` |
| Segment lib + cache | `translate-segment.ts`, `segment-cache.ts` |
| Daily integration | `src/lib/daily.ts`, `daily-transcription.ts` |
| LLM core + caption limits | `src/lib/llm.ts`, `src/lib/llm-rate-limit.ts` (`caption` scope; `LLM_MAX_CAPTION_*`) |

## Implementation workflow

### Phase 1 — Capture (no translation yet)

1. Enable Daily transcription on domain (`enable_transcription`).
2. **Also set `enable_transcription_storage: true` on domain (and ideally rooms).** Without storage, live STT can work and Daily may still show a `t_finished` transcript id, but `access-link` fails forever and `session_transcripts` stays empty. See storage incident + preflight docs above.
3. After payment provision, set `auto_start_transcription` on meeting tokens for mentors when product requires STT.
4. On `transcript.ready-to-download`, fetch WebVTT via Daily access-link → persist `session_transcripts`.
5. Pass real transcript (truncated per token budget) to `SessionAgent.synthesizeSession`.
6. Before any paid session: run [storage preflight](../../docs/how-to/daily-transcription-storage-preflight.md) — not just “captions looked fine.”

### Phase 2 — Post-session translation ✅ shipped

1. `users.preferred_locale` on mentee profile (settings server action; BCP-47, default `en`).
2. After APX-03, `maybeRunTranslationIfNeeded()` runs APX-06 inline when English `summary_json` exists and mentee locale ≠ `en` (also on transcription-disabled `meeting.ended` path).
3. `session_translations.summary_json` per `target_locale`; `GET /api/session/[bookingId]/recap` resolves locale server-side (`recap-locale.ts`); session room polls without `?locale=`.
4. Checkout locale picker remains **Phase 2b** — not in this slice.

### Phase 3 — Live translated captions ✅ shipped (v0.2.0.0 bidirectional)

1. `createCallObject()` with `startTranscription({ language: 'multi', model: 'nova-3' })` on owner join; guard duplicate starts on rejoin.
2. `transcription-message` → resolve speaker → `shouldTranslateForViewer()` → `translation-queue` → `translate-segment` API.
3. Per-booking LRU segment cache; server enforces target locale per viewer (mentee and mentor each see their preferred language).
4. `CaptionRail` below video band; paused banner on rate limit (shows original speech, auto-resumes).
5. Post-call: `SessionTranscriptPanel` + batch translate for completed bookings.

### Phase 3b — Post-call transcript panel ✅ shipped

1. `GET /api/session/[bookingId]/transcript` returns utterances with speaker roles.
2. `POST /api/session/[bookingId]/transcript/translate` batch-translates for mentee locale.
3. UI toggle on completed session page ("View in {locale}").

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
- Ship or claim post-call transcripts when Daily `enable_transcription_storage` is false, or when you have only proven live captions.
- Treat Daily transcript list `t_finished` as proof of downloadable WebVTT.
- Assume enabling storage later recovers past meetings — it does not.

## Related agents

| Agent | Role with translation |
|-------|----------------------|
| APX-03 SessionAgent | Consumes English transcript window for synthesis |
| APX-04 ComplianceAgent | D2+: moderate English canonical transcript |
| APX-06 TranslationAgent | Post-session recap translation (`session_translations`) |
