# Engineering review — transcript translation & token optimization

Structured eng review for D3: decisions, risks, token budgets, and implementation sequence.

**Date:** 2026-06-06  
**Status:** Phase 1–3 implemented on `translation-p3-4`; Phase 4 moat hardening next  
**Related:** [D3 roadmap](../d3-transcript-translation-roadmap.md), [architecture](./transcript-translation-architecture.md)

---

## Executive summary

D3 adds **translation as a derived layer** on English canonical transcripts. The highest-risk mistakes are (1) sending full 60-minute transcripts to LLMs, and (2) storing only translated text. This review locks token budgets, caching, and hook points so Phase 1–3 can ship incrementally without rework.

---

## Eng decisions (locked for D3)

| # | Decision | Rationale |
|---|----------|-----------|
| E1 | Canonical English in DB | Audit, APX-04 moderation, XPRIZE evidence |
| E2 | Daily STT, AstroLink MT | Avoid duplicate STT path; translation is the wedge |
| E3 | Extend `llm.ts`, not AI SDK (Phase 0–2) | [AI SDK review](./transcript-translation-ai-sdk-review.md) |
| E4 | Segment-based translation | Bounded tokens, cacheable, parallelizable |
| E5 | Flash model for translation; flash for APX-03 | Pro reserved for briefings/compliance PDFs |
| E6 | `selectTranscriptWindow()` before APX-03 | APX-03 does not need verbatim 45-min transcript |
| E7 | LRU cache on `(hash(text), locale, glossary_v)` | Live caption cost control |
| E8 | New agent APX-06 for translation audit trail | Consistent with APX-01–05 pattern |
| E9 | `preferred_locale` on `users`, not `bookings` v1 | Simpler; per-booking override in Phase 2b |
| E10 | Skip translation when `target_locale === source_locale` | Zero marginal cost for English buyers |

---

## Token optimization strategy

### Problem

Naive approach for a 45-min expert session:

| Step | Naive tokens | Risk |
|------|--------------|------|
| APX-03 full transcript | 15,000–25,000 | Cost, latency, context overflow |
| Recap translate (whole JSON) | 2,000–4,000 | Acceptable but redundant with segment path |
| Live translate (every utterance × 200) | 40,000+ cumulative | Runaway cost without cache |

**Target:** 40–60% LLM token reduction vs naive full-transcript approach.

---

### T1 — Transcript windowing (APX-03 input)

**Implementation:** `src/lib/transcript-translation/token-budget.ts`

APX-03 needs *semantic coverage*, not verbatim transcript:

1. Always include first ~5 min (intake, objectives).
2. Always include last ~5 min (conclusions, next steps).
3. Fill middle with highest-density segments (longest utterances by expert).
4. Hard cap: **8,000 estimated tokens** (~32K chars).

```typescript
selectTranscriptWindow(utterances, { maxTokens: 8000, headMinutes: 5, tailMinutes: 5 })
```

**Savings:** ~50–70% vs full transcript for typical 45-min call.

---

### T2 — Segment translation (live + batch)

**Rules**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max segment size | 500 tokens | Flash model sweet spot |
| Overlap | 0 | Utterances are atomic from Daily |
| Batch concurrency | 5 | Avoid rate limit storms |
| Cache | LRU 500 entries / session | Repeated phrases ("let me share my screen") |

**Prompt tokens (fixed overhead):** ~200 tokens glossary + system → amortize over segment batch.

---

### T3 — Recap translation (structured)

Two options evaluated:

| Approach | Tokens | Verdict |
|----------|--------|---------|
| Translate whole `PostSessionOutput` JSON in one call | ~1,500 | ✅ Phase 2 v1 — simple, 1 call |
| Translate field-by-field | ~2,500 | ❌ More calls, more overhead |
| Re-run APX-03 in target language | ~10,000+ | ❌ Loses English canonical |

**Phase 2 v1:** Single `generateStructuredJson` call with `target_locale` in system prompt, output same schema in target language. Store in `session_translations.summary_json`. Keep `sessions.summary_json` English-only.

---

### T4 — Filler stripping (synthesis only)

Strip backchannel/filler from **APX-03 input window only**:

```text
/\b(um|uh|you know|like|sort of|kind of)\b/gi
```

Do **not** strip from `session_transcripts` canonical store.

**Savings:** ~5–10% on synthesis input.

---

### T5 — Skip conditions

| Condition | Action |
|-----------|--------|
| `target_locale === 'en'` | Skip APX-06 entirely |
| Empty transcript | APX-03 template path (existing); skip translation |
| Segment `text.length < 3` | Skip (noise) |
| Cache hit | Skip LLM call |

---

### T6 — Observability

Log to `audit_log` per translation job:

```json
{
  "agent_id": "APX-06",
  "event": "SEGMENT_TRANSLATED",
  "payload": {
    "booking_id": "...",
    "segment_id": "...",
    "source_locale": "en",
    "target_locale": "pt-BR",
    "input_tokens_est": 42,
    "cache_hit": false,
    "glossary_version": 1
  }
}
```

Enables per-session cost attribution and XPRIZE T8 export.

---

## Cost model (optimized)

45-min session, 2 participants, ~200 utterances, buyer `pt-BR`:

| Step | Naive $ | Optimized $ | Technique |
|------|---------|-------------|-----------|
| Daily STT | $0.53 | $0.53 | Fixed |
| APX-03 | ~$0.12 | ~$0.04 | T1 windowing |
| Live translate (~200 seg) | ~$0.40 | ~$0.12 | T2 cache (~70% hit) |
| Recap translate | ~$0.06 | ~$0.04 | T3 single structured call |
| **Total LLM** | ~$0.58 | ~$0.20 | **~65% reduction** |

*Estimates assume Gemini 2.0 Flash pricing order-of-magnitude; validate with `audit_log` token counts in Phase 1.*

---

## Implementation sequence

```
Phase 0 (now)     types, token-budget, docs, skill, rule
     │
Phase 1           migration session_transcripts
     │             fetch WebVTT in post-session.ts
     │             wire selectTranscriptWindow → APX-03
     │             English recap UI
     ▼
Phase 2           users.preferred_locale migration
     │             APX-06 + session_translations
     │             recap API with locale
     ▼
Phase 3           Daily transcription events in session UI
                  translateSegment + caption rail
                  latency + cache metrics
```

**Critical path:** Phase 1 does not depend on AI SDK or translation — ship capture first.

---

## Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Daily iframe cannot receive `transcription-message` | ~~Blocks Phase 3~~ Resolved | Migrated to `createCallObject()` in v0.1.5.0 |
| Glossary misses new program names | Buyer trust | Expert onboarding form: "terms to preserve" |
| LLM translates ITAR-adjacent content incorrectly | Compliance | English canonical + APX-04 flag; never auto-redact in v1 |
| Rate limits on burst translation | Recap delay | Queue with concurrency 5; show "Translating recap…" |
| Webhook missed + no transcript | Empty recap | Existing D2 reconciliation; retry Daily transcript fetch |

---

## API surface (planned)

| Endpoint | Phase | Purpose |
|----------|-------|---------|
| `GET /api/session/[bookingId]/recap` | 1 | English `summary_json` |
| `GET /api/session/[bookingId]/recap?locale=pt-BR` | 2 | Localized recap |
| `POST /api/session/[bookingId]/translate-segment` | 3 | Internal/streaming segment MT |
| Mentee settings server action | 2 | Set `preferred_locale` (D19 — no `PATCH /api/user/locale`) |

---

## Testing strategy

| Layer | Test |
|-------|------|
| `token-budget.ts` | Vitest: window selection, cap enforcement |
| `glossary.ts` | Vitest: terms present in prompt builder |
| APX-06 | Contract test with `E2E_STUB_LLM` |
| post-session | Integration: mock WebVTT → transcript row |
| E2E | `e2e/localized-recap.spec.ts` — pt-BR mentee recap stub |

---

## Open questions (product)

1. **Brief translation:** Translate APX-02 brief at booking time, or lazy on first open?
2. **Mentor language:** v1 mentors English-only, or support expert speaks Spanish?
3. **Pricing:** Absorb translation cost in session price vs locale premium?
4. **Launch locales:** Confirm `es`, `pt-BR`, `fr`, `ja` with first 3 non-US pilots.

---

## Approval checklist

- [x] Canonical English decision (E1)
- [x] Token budget utilities specified
- [x] AI SDK deferral documented
- [x] Phase gates in roadmap
- [x] Phase 1 migration + post-session gate
- [x] Phase 2 APX-06 + `session_translations` + locale recap API/UI
- [ ] Product answers to open questions

---

## Related

- [D3 roadmap](../d3-transcript-translation-roadmap.md)
- [Architecture](./transcript-translation-architecture.md)
- [AI SDK review](./transcript-translation-ai-sdk-review.md)
- Code: `src/lib/transcript-translation/`
