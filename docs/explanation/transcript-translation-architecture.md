# Transcript translation architecture

How AstroLink captures expert-session speech, translates it for buyers, and feeds downstream agents — without breaking the D1 webhook-driven completion model.

**Audience:** Engineers implementing D3  
**Related:** [D3 roadmap](../d3-transcript-translation-roadmap.md), [engineering review](./transcript-translation-engineering-review.md)

---

## Problem

AstroLink's expert network is English-centric today, but buyers are global (LATAM, Europe, Japan, MENA). Generic video apps solve "hear the meeting in my language." AstroLink must solve:

1. **Technical fidelity** — "RPO", "ITAR", "Falcon Heavy" must not be mangled.
2. **Session context** — Translation should respect APX-02 objectives and service type.
3. **Trust & audit** — Compliance and XPRIZE evidence need a canonical English record.
4. **Economics** — Translation runs on every paid minute; token spend must be bounded.

---

## End-to-end flow (target state)

```
Pre-call                    During call                      Post-call
────────                    ───────────                      ─────────

APX-02 brief          →     Daily transcription        →     Fetch WebVTT
(buyer locale stored)       (Deepgram, English ASR)          session_transcripts
                            │                                │
                            ▼                                ▼
                      transcription-message            APX-03 synthesis
                            │                          (English window)
                            ▼                                │
                      translateSegment()                     ▼
                      (flash, cached)                  APX-06 recap translate
                            │                          (if locale ≠ en)
                            ▼                                │
                      Caption rail UI                      ▼
                      (buyer preferred_locale)       Localized recap page
```

---

## Layered design

### Layer 1 — Speech-to-text (vendor: Daily + Deepgram)

Daily owns ASR. AstroLink does **not** run its own STT in D3 v1.

- Enable `enable_transcription` on Daily domain.
- Start via `auto_start_transcription` on mentor meeting token or `startTranscription()` from custom UI.
- Receive `transcription-message` events during call (Phase 3).
- After `meeting.ended`, fetch WebVTT via Daily REST API (Phase 1).

**Why not AI SDK `transcribe`?** See [AI SDK review](./transcript-translation-ai-sdk-review.md). Daily already bundles Deepgram; adding a parallel STT path increases cost and complexity without wedge value.

### Layer 2 — Canonical storage (AstroLink-owned)

| Artifact | Language | Table |
|----------|----------|-------|
| Raw utterances | Source (usually `en`) | `session_transcripts` |
| Post-session synthesis | English | `sessions.summary_json` |
| Localized recap | Target locale | `session_translations` |
| Audit trail | English | `audit_log` |

**Rule:** Never persist LLM output in a target language as the only copy.

### Layer 3 — Translation (AstroLink-owned, APX-06)

Two pipelines share `translateSegment()`:

| Mode | Trigger | Latency | Model |
|------|---------|---------|-------|
| Live | `transcription-message` | &lt; 2s | `llmFlashModel` |
| Batch | After APX-03 | Async (seconds) | `llmFlashModel` |

Both inject `AEROSPACE_GLOSSARY` and optionally APX-02 objective keywords into the system prompt.

### Layer 4 — Presentation

| Surface | Phase | Data source |
|---------|-------|-------------|
| Live caption rail | 3 | Streaming `translateSegment` |
| Session recap page | 1–2 | `summary_json` or `session_translations` |
| Mentee dashboard card | 2 | Recap API with locale |

---

## Integration points (existing code)

### `post-session.ts`

Today:

```typescript
await sessionAgent.synthesizeSession(booking.id, '', durationMinutes);
```

Phase 1 target:

```typescript
const transcript = await fetchAndPersistDailyTranscript(booking.id);
const window = selectTranscriptWindow(transcript.utterances, { maxTokens: 8000 });
await sessionAgent.synthesizeSession(booking.id, window.text, durationMinutes);
// Phase 2:
if (buyerLocale !== 'en') {
  await translationAgent.translateSessionRecap(booking.id, buyerLocale);
}
```

### `session-room-client.tsx`

**Shipped (Phase 3, v0.2.0.0):** `DailyCallRoom` uses `createCallObject()` (not iframe). `use-daily-call` starts `multi` + `nova-3` transcription on owner join when `DAILY_TRANSCRIPTION_ENABLED=true`. `use-live-captions` resolves speakers, picks per-viewer translate direction, queues segment calls to `translate-segment`, and renders `CaptionRail` below video for any participant whose locale differs from the detected speech. Post-call `SessionTranscriptPanel` batch-translates stored utterances.

### `SessionAgent` (APX-03)

No schema change required. Receives truncated English text. Optionally pass `buyer_locale` in prompt so synthesis mentions language context ("Session conducted in English; buyer prefers Spanish").

---

## Locale model

- **Storage:** BCP-47 tags (`en`, `es`, `pt-BR`, `fr`, `ja`).
- **Source locale:** Detected from mentor profile or ASR `language` param (default `en`).
- **Target locale:** `users.preferred_locale`, overridable per booking in Phase 2.
- **Fallback chain:** `pt-BR` → `pt` → `en`.

---

## Caching strategy

| Cache | Key | TTL | Purpose |
|-------|-----|-----|---------|
| Segment translation | `sha256(text + target_locale + glossary_version)` | Session duration | Live caption dedup |
| Recap translation | `booking_id + target_locale` | Permanent (DB) | Avoid re-translate on page refresh |
| Glossary | In-memory | Deploy | Version bump invalidates segment cache |

---

## Security & compliance

- Transcripts may contain export-control-adjacent discussion → English canonical for APX-04 moderation (D2).
- Do not send transcripts to third-party translation APIs without data-processing review; use existing OpenAI/Gemini via `llm.ts` (same DPA path as APX-02/03).
- `redact` / PII options available in Daily Deepgram config for Phase 4.

---

## Alternatives considered

| Approach | Verdict |
|----------|---------|
| Translate at display time only (no DB) | Rejected — recap refresh cost, no offline access |
| Store only translated transcript | Rejected — breaks audit and moderation |
| Full-app i18n first | Deferred — separate initiative; D3 is session-scoped |
| Google Cloud Translation API cascade | Deferred — evaluate if LLM cost exceeds API at scale |
| AI SDK migration | Deferred — see dedicated review; extend `llm.ts` for D3 |

---

## Related

- [Video session architecture](./video-session-architecture.md)
- [D3 roadmap](../d3-transcript-translation-roadmap.md)
- [Case studies](./transcript-translation-case-studies.md)
