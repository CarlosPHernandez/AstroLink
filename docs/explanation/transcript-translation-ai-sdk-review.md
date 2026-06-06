# AI SDK review — transcript translation feature

**Question:** Should AstroLink adopt [Vercel AI SDK](https://ai-sdk.dev) (`ai`, `@ai-sdk/*`) for D3 transcript translation?

**Recommendation:** **No for Phase 0–2.** Extend existing `src/lib/llm.ts`. **Re-evaluate for Phase 3** if we build a custom streaming caption UI that benefits from `streamText` / `useChat` patterns.

**Date:** 2026-06-06  
**Reviewer:** Engineering (Cloud Agent foundation slice)

---

## Current stack

| Component | Implementation |
|-----------|----------------|
| LLM access | `src/lib/llm.ts` — `generateStructuredJson`, `callLlmWithBackoff` |
| Providers | Direct `openai` + `@google/genai` (no `@ai-sdk/*`) |
| Agents | Class-based (`SessionAgent`, `BriefingAgent`, …) |
| Structured output | Hand-rolled JSON schemas |
| Rate limits | `src/lib/llm-rate-limit.ts` |
| E2E stub | `E2E_STUB_LLM=true` |

`package.json` does not include `ai` or `@ai-sdk/openai` / `@ai-sdk/google`.

---

## AI SDK capabilities relevant to D3

From [ai-sdk.dev](https://ai-sdk.dev/docs/introduction) (v6 surface):

| AI SDK API | D3 use case | Fit |
|------------|-------------|-----|
| `generateText` | Segment translation | **Medium** — duplicates `generateStructuredJson` for plain text |
| `streamText` | Live caption streaming | **High** — Phase 3 UI latency |
| `transcribe` | Speech-to-text | **Low** — Daily already provides Deepgram STT |
| `generateSpeech` | TTS / interpreter voice | **Out of scope** D3 v1 |
| `ToolLoopAgent` | Multi-step translation + glossary lookup | **Low** — overkill for segment MT |
| `useChat` / `useCompletion` | Client caption stream | **Medium** — only if custom SSE route |
| AI Gateway provider | Unified model routing | **Medium** — future cost/failover |

---

## Option analysis

### A — Stay on `llm.ts` (recommended Phase 0–2)

**Pros**

- Zero migration risk; APX-02/03/04 patterns unchanged.
- `generateStructuredJson` already handles recap-shaped output; translation is plain string → trivial wrapper.
- Rate limits, backoff, E2E stub already wired.
- One less dependency for XPRIZE audit narrative.

**Cons**

- No first-class streaming helper for Phase 3 captions.
- Manual provider switching vs AI Gateway.

**Implementation sketch**

```typescript
// APX-06 — plain text, not structured JSON
export async function translateSegment(input: TranslateSegmentInput): Promise<string> {
  return callLlmWithBackoff(() =>
    generatePlainText({
      model: llmFlashModel,
      systemInstruction: buildTranslationSystemPrompt(input),
      prompt: input.text,
      rateLimitKey: input.rateLimitKey,
    }),
  );
}
```

Add `generatePlainText` to `llm.ts` (~30 lines) rather than importing AI SDK.

---

### B — AI SDK for translation only

**Pros**

- `streamText` for Phase 3 with standard backpressure.
- `transcribe` if we ever leave Daily STT.
- AI Gateway for model failover (OpenAI ↔ Gemini).

**Cons**

- Two LLM abstractions in one codebase during migration.
- Must re-wire rate limits, audit logging, E2E stubs for AI SDK paths.
- Team must learn AI SDK v6 breaking changes (`useChat` etc.).

**Verdict:** Cost &gt; benefit until Phase 3 streaming is on the critical path.

---

### C — Full AI SDK migration (all agents)

**Pros**

- Unified agent story (`ToolLoopAgent`) for XPRIZE demo.
- Future `useChat` expert Q&A modality.

**Cons**

- Large refactor unrelated to translation wedge.
- Delays D3 Phase 1 (transcript capture) by weeks.

**Verdict:** Reject for D3. Consider post-D3 platform initiative.

---

## Feature-by-feature verdict

| D3 feature | Best tool | Notes |
|------------|-----------|-------|
| Daily WebVTT fetch | Daily REST API | Not AI SDK |
| Live ASR | Daily `transcription-message` | Not AI SDK `transcribe` |
| Segment translation | `llm.ts` + flash model | AI SDK optional Phase 3 |
| Recap translation | `llm.ts` batch | Structured recap stays APX-03 |
| Caption UI streaming | React state + SSE **or** AI SDK `streamText` | Decide in Phase 3 spike |
| Glossary injection | Prompt engineering | Provider-agnostic |

---

## When to adopt AI SDK (triggers)

Re-open this review when **any** of:

1. Phase 3 spike shows &gt; 3 days wrestling with raw OpenAI/Gemini streaming in Next.js Route Handlers.
2. We need AI Gateway for production failover between OpenAI and Gemini on translation.
3. D2 async text modality ships and needs `useChat` with tool calling.
4. `ai` package is already added for another feature — marginal cost drops.

---

## Phase 3 spike plan (if AI SDK adopted)

1. `pnpm add ai @ai-sdk/openai` (or Gateway provider).
2. Prototype `POST /api/session/[id]/translate-stream` with `streamText`.
3. Client: `useCompletion` or manual `ReadableStream` reader in `session-room-client.tsx`.
4. Compare p95 latency vs direct provider SDK.
5. Port rate limit + audit hooks before merge.

**Success criteria:** AI SDK path ≤ 10% latency regression vs direct SDK, with simpler client code.

---

## AI SDK `transcribe` — explicit non-use

AI SDK offers `transcribe` for audio files/streams. AstroLink uses Daily's bundled Deepgram:

- **Cost:** Daily ~$0.0059/participant-min vs separate STT + video.
- **Integration:** Transcription events already normalized by Daily.
- **Migration cost:** Would require leaving iframe-only model.

**Verdict:** Do not use AI SDK `transcribe` while Daily remains video provider.

---

## Summary table

| Criterion | `llm.ts` extend | AI SDK |
|-----------|-----------------|--------|
| Time to Phase 1 | ✅ Fastest | ❌ Slower |
| Phase 3 streaming | ⚠️ Manual | ✅ Built-in |
| Consistency with APX agents | ✅ | ❌ Dual stack |
| E2E stub story | ✅ Exists | ⚠️ Rebuild |
| AI Gateway | ⚠️ Manual | ✅ Native |
| Package weight | ✅ None added | ❌ +deps |

**Final:** Extend `llm.ts` with `generatePlainText` for APX-06. Document Phase 3 streaming spike before adding `ai` package.

---

## Related

- [Engineering review](./transcript-translation-engineering-review.md)
- [Architecture](./transcript-translation-architecture.md)
- [D3 roadmap](../d3-transcript-translation-roadmap.md)
- Skill: `skills/transcript-translation/SKILL.md`
