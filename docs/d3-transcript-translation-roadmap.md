# D3 — Transcript translation roadmap

**Wedge:** Cross-language access to verified aerospace experts — a buyer in São Paulo can follow a NASA alum in real time and receive a recap in Portuguese, without AstroLink becoming a generic video app.

**Moat:** Domain-tuned translation (aerospace glossary, ITAR-aware moderation hooks, session context from APX-02 brief) layered on paid expert sessions — not commodity captions.

**Last updated:** 2026-06-07  
**Status:** Phase 2 shipped on `feat/d3-phase-2-recap-i18n` — localized post-session recap (APX-06); Phase 3 live captions next  
**Depends on:** D1 video golden path shipped; D3 Phase 1 transcript capture shipped

---

## Why this feature

| Stakeholder | Problem today | D3 outcome |
|-------------|---------------|------------|
| Mentee (buyer) | Expert speaks English; buyer is fluent in another language | Live captions + recap in `preferred_locale` |
| Mentor (expert) | No visibility into whether buyer understood | Optional "buyer language" badge on session shell |
| AstroLink ops | Empty transcript → weak APX-03 recap | Real transcript → better synthesis → higher repeat booking |
| Investors / XPRIZE | "AI agent" story is pre-call brief only | End-to-end agent chain: brief → live assist → translated recap |

---

## Competitive positioning (summary)

See [transcript-translation-case-studies.md](./explanation/transcript-translation-case-studies.md) for full analysis.

| Product | What they do | AstroLink differentiation |
|---------|--------------|---------------------------|
| Zoom / Teams / Meet | Generic meeting translation (30–100+ langs) | **Expert-session context**: brief objectives, aerospace glossary, paid SLA |
| DeepL / Google Translate API | Text translation API | **Session-native**: utterance timing, speaker roles, recap structure |
| Interprefy / KUDO | Human + hybrid interpretation | **Async-first, escalate later**: AI captions at scale; human for ITAR/consent slices (D4) |
| Otter.ai | Meeting notes + transcription | **Vertical**: aerospace experts, escrow, compliance trail |

---

## Phased delivery

### Phase 0 — Foundation (this slice) ✅ target

| Deliverable | Path |
|-------------|------|
| Agent skill | `skills/transcript-translation/SKILL.md` |
| Cursor rule | `.cursor/rules/transcript-translation.mdc` |
| Roadmap (this doc) | `docs/d3-transcript-translation-roadmap.md` |
| Architecture | `docs/explanation/transcript-translation-architecture.md` |
| Eng review + token plan | `docs/explanation/transcript-translation-engineering-review.md` |
| AI SDK evaluation | `docs/explanation/transcript-translation-ai-sdk-review.md` |
| Case studies | `docs/explanation/transcript-translation-case-studies.md` |
| Types + token budget | `src/lib/transcript-translation/` |

**Exit criteria:** Engineering can estimate cost per session and begin Phase 1 without re-litigating architecture.

---

### Phase 1 — Transcript capture ✅ shipped

**Goal:** APX-03 receives real English transcript; `transcript_available = true`.

| Task | Status | Notes |
|------|--------|-------|
| DB: `session_transcripts` table | Shipped | `20260606120000_session_transcripts.sql` |
| Daily: enable transcription on domain | Shipped | Env-gated via `isDailyTranscriptionEnabled()` |
| Fetch WebVTT on `transcript.ready` | Shipped | Dual-trigger gate in `post-session.ts` |
| Token window for APX-03 input | Shipped | `selectTranscriptWindow()` |
| Session recap UI (English) | Shipped | `GET /api/session/[id]/recap` + session room polling |

**Exit criteria:** Post-session recap reflects actual call content in demo.

---

### Phase 2 — Post-session recap translation ✅ shipped

**Goal:** Buyer sees recap in `preferred_locale`.

| Task | Status | Notes |
|------|--------|-------|
| DB: `users.preferred_locale` | Shipped | `20260607120000_session_translations.sql`; default `en` |
| DB: `session_translations` | Shipped | `target_locale`, `summary_json`, RLS mirrors transcripts |
| APX-06 TranslationAgent | Shipped | `translateSessionRecap()` — structured `PostSessionOutput` in one LLM call |
| API: `GET /api/session/[id]/recap?locale=` | Shipped | Mentee default from profile; `translationPending` / `translationFailed` flags |
| Mentee settings locale | Shipped | Server action on `/dashboard/mentee/settings` (no `PATCH /api/user/locale`) |
| Booking flow: language preference | Deferred (2b) | Checkout picker out of Phase 2 scope |

**Locales v1:** `en`, `es`, `pt-BR`, `fr`, `ja` (align with Zoom benchmark languages + LATAM wedge).

**Exit criteria:** E2E `e2e/localized-recap.spec.ts` — seed mentee `preferred_locale=pt-BR` sees `[pt-BR]` stub recap after `simulate_meeting_ended`.

---

### Phase 3 — Live translated captions

**Goal:** Mentee reads expert speech in their language during the call.

| Task | Status | Notes |
|------|--------|-------|
| Session UI: Daily transcription events | Not started | Likely migrate from iframe-only to Prebuilt/custom |
| `translateSegment()` streaming | Not started | Flash model, LRU cache by text hash |
| Caption rail component | Not started | Mobile-first; toggle on/off |
| Latency budget | Not started | Target p95 &lt; 2s segment-to-display |
| Mentor UX: "Captions on for buyer" indicator | Not started | |

**Exit criteria:** Dual-device demo — expert English, buyer Spanish captions.

---

### Phase 4 — Moat hardening (post-D3)

- Aerospace glossary expansion per expert vertical (launch, EO, policy).
- APX-04 transcript moderation on canonical English.
- Human interpreter escalation path (Interprefy-style) for flagged sessions.
- Buyer ↔ expert **async text** modality with same translation pipeline (D2 synergy).
- XPRIZE evidence: translation quality metrics + decision logs.

---

## Data model (planned)

```sql
-- Phase 1
CREATE TABLE public.session_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings (id) ON DELETE CASCADE,
  source_locale text NOT NULL DEFAULT 'en',
  vtt_text text,
  utterances_json jsonb,  -- [{ speaker, start_ms, end_ms, text }]
  daily_transcript_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Phase 2
ALTER TABLE public.users ADD COLUMN preferred_locale text NOT NULL DEFAULT 'en';

CREATE TABLE public.session_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  target_locale text NOT NULL,
  summary_json jsonb,
  segment_translations_json jsonb,
  translated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, target_locale)
);
```

---

## Cost model (rough)

Assumptions: 45-min session, 2 participants, 6,000 words transcript.

| Component | Estimate | Notes |
|-----------|----------|-------|
| Daily transcription | ~$0.53 | 2 × 45 min × $0.0059 |
| APX-03 synthesis | ~$0.02–0.08 | Flash, truncated window |
| Phase 2 recap translation | ~$0.05–0.15 | ~120 segments × flash |
| Phase 3 live translation | ~$0.10–0.30 | Cache hit rate dependent |

**Token optimization** (engineering review) can reduce LLM spend 40–60% vs naive full-transcript approaches.

---

## Success metrics

| Metric | Phase | Target |
|--------|-------|--------|
| `transcript_available` rate | 1 | &gt; 90% of completed sessions |
| Recap NPS (localized vs en-only) | 2 | +15 pts for non-English buyers |
| Caption latency p95 | 3 | &lt; 2s |
| Glossary term accuracy (manual audit) | 3 | &gt; 95% preserved |
| Repeat booking rate (non-English cohort) | 4 | +10% vs control |

---

## Repo map

| Area | Path |
|------|------|
| Skill | `skills/transcript-translation/SKILL.md` |
| Rule | `.cursor/rules/transcript-translation.mdc` |
| Types | `src/lib/transcript-translation/types.ts` |
| Token budget | `src/lib/transcript-translation/token-budget.ts` |
| Glossary | `src/lib/transcript-translation/glossary.ts` |
| Post-session | `src/lib/post-session.ts` |
| Session agent | `src/services/agents/session-agent.ts` |
| Session UI | `src/app/session/[bookingId]/` |

---

## Verify after each phase

1. **Phase 1:** Complete live session → `session_transcripts` row → recap mentions call topics (not empty template).
2. **Phase 2:** Set mentee `preferred_locale=pt-BR` in settings → after session, recap UI shows localized stub (`[pt-BR]` prefix under `E2E_STUB_LLM`); `audit_log` shows `RECAP_TRANSLATED` on success.
3. **Phase 3:** Enable captions → expert speaks → buyer sees translated lines within 2s.
4. **Regression:** English-only users see no added latency or cost (translation skipped when `locale=en`).

---

## Related

- [D2 next steps](./d2-next-steps.md)
- [Video session architecture](./explanation/video-session-architecture.md)
- [Transcript translation architecture](./explanation/transcript-translation-architecture.md)
