# Live caption rate limits and translation queue

Why bidirectional live captions use a separate LLM budget, an in-flight queue, and a pause banner instead of hard errors.

**Audience:** Engineers tuning demos or production caption limits  
**Related:** [engineering review](./transcript-translation-engineering-review.md), [video session reference](../reference/video-session.md)

---

## The problem

Captions are **bidirectional**: we translate the *other* person's speech into the viewer's locale. A 45-minute call with two active speakers can generate hundreds of `translate-segment` requests in a few minutes.

Without guards, three failure modes appear:

1. **Shared rate limits** — caption traffic competes with APX-02 briefings and APX-03 synthesis on the global `LLM_MAX_*` buckets.
2. **Request storms** — Daily emits `transcription-message` events faster than the LLM can respond; unconstrained parallelism spikes cost and 429s.
3. **Bad UX on limits** — treating every 429 as a fatal error leaves a persistent red "Translation unavailable" badge even though the call can continue with original speech.

---

## The approach

### Separate `caption` scope

`assertLlmRateLimit()` accepts `scope: 'caption'`. Live segment translation uses `LLM_MAX_CAPTION_REQUESTS_PER_*` (defaults: 60/min, 300/hour, 1000/day), keyed to the booking's mentee id. General briefing and synthesis traffic stays on the `default` scope.

This isolates caption bursts from the rest of the app's LLM budget.

### In-flight queue (cap = 6)

`translation-queue.ts` admits at most **6 concurrent** segment translations per client session so overlapping bilingual turns are less likely to drop the other speaker. Additional segments queue; the oldest queued id is dropped when the queue is full (in-flight work is never cancelled).

```
transcription-message
       │
       ▼
resolveCaptionDirection() ──► skip if same locale
       │
       ▼
admitTranslationRequest() ──► start now OR queue
       │
       ▼
POST /translate-segment
       │
       ▼
dequeueNextTranslationWork() ──► next pending segment
```

Dropped queue entries finalize as **original speech** in the caption rail so the UI never stalls waiting for a slot.

### Graceful pause on `rate_limited` / `budget_exceeded`

When the API returns `429` with `code: rate_limited` or `budget_exceeded`, the client:

1. Shows the current line as original text (not an error state).
2. Sets `translationPaused` and displays **Live translation paused — showing original speech**.
3. Schedules auto-resume after `retryAfterMs` from the server (minimum 1 second).

New utterances still appear as original text while paused; translation requests are gated until the timer clears.

---

## Cost under sustained speech

Order-of-magnitude for a 45-min bilingual call (~200 utterances, mentee `es`, mentor `en`):

| Component | Requests | Mitigation | Effective LLM calls |
|-----------|----------|------------|---------------------|
| Segment translate | ~200 per viewer who needs translation | LRU cache (~70% hit on repeated phrases) | ~60–120 per side |
| Queue drops | Bursts during fast dialogue | Cap=3 + drop oldest queued | Bounded parallelism |
| Rate limit | Sustained over limit | Pause + resume | Zero calls while paused |

The engineering review [cost model](./transcript-translation-engineering-review.md#cost-model-optimized) estimated ~$0.12 live translate per session with cache. Bidirectional mode can approach **2×** that when both sides need translation, but the caption scope and cache still bound worst case versus sharing the global 10/min limit.

---

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Caption scope separate from global | Briefings still work during heavy caption demos | Two limit configs to tune |
| Queue cap=3 | Predictable latency and cost | Fast cross-talk may drop queued segments (shows original) |
| Pause instead of error badge | Call continues; no scary red state | Viewer sees untranslated speech until window clears |
| Default `detectedLocale` → `en` when missing | Avoids mistranslating English for English viewers | Spanish-only speech with bad ASR metadata may skip translation until metadata improves |

---

## Tuning for local demos

In `.env.local`:

```bash
DAILY_TRANSCRIPTION_ENABLED=true
LLM_MAX_CAPTION_REQUESTS_PER_MINUTE=60   # raise for heavy dual-speaker demos
LLM_MAX_CAPTION_REQUESTS_PER_HOUR=300
LLM_MAX_CAPTION_REQUESTS_PER_DAY=1000
LLM_RATE_LIMIT_ENABLED=true              # set false only for local experiments
```

If you disable rate limits locally, keep `E2E_STUB_LLM=true` in Playwright — E2E does not depend on real caption quotas.

---

## Related

- [Tutorial: bidirectional live captions](../tutorial/bidirectional-live-captions.md)
- [Transcript translation architecture](./transcript-translation-architecture.md)
- `src/lib/llm-rate-limit.ts`, `src/lib/transcript-translation/translation-queue.ts`, `src/components/session/use-live-captions.ts`
