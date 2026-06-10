# D2 next steps

Follow-on from [d1-implementation-plan.md](./d1-implementation-plan.md) after the live 1:1 golden path ships.

**Last updated:** 2026-06-01

## Recently shipped (D1.5 groundwork)

| Item | Status | Notes |
|------|--------|--------|
| Post-booking brief auto-open | Done | `/dashboard/mentee?booked={id}` opens `BriefingSidebar` (ready if `briefing_json` exists, else thinking + generate) |
| Plain-language AI copy | Done | User-facing UI no longer shows internal agent codes (APX-*) |
| Intake moderation stub | Done | `src/lib/intake-moderation.ts` — wire before `BookingAgent.bookSession` in D2 |

## D2 priorities (ordered)

### 1. Three paid modalities (design phase D2)

- **Text/async threads** — bounded window, in-app only, SLA + payout on close.
- **Recorded video (Cameo-style)** — request form, expert upload, fulfillment state; new `service_type` (e.g. `personalized_video`).
- Reuse Stripe Connect 80/20 split; expert-set prices per modality.

### 2. Intake & session moderation (AI + ops triage)

- Call `screenBookingIntake()` from `POST /api/book` after schema validation.
- Gemini-backed flags: ITAR/export-control-adjacent keywords, hateful speech, hostile behavior → **flag for ops review**, not auto-block in v1.
- Extend to post-session transcripts via `compliance-agent` (design doc § Compliance & trust).
- Types live in `src/lib/intake-moderation.ts`.

### 3. Expert profile v1

- **Shipped (0.1.6.0)**: Dedicated `/experts` directory — full roster, category filters, card grid, inline preview (desktop modal, mobile sheet), long-bio Read more. Landing shows a six-card teaser with “View all experts.” Shared `getExpertBookHref` and `expert-bio` helpers; `e2e/experts-directory.spec.ts`.
- **Shipped (0.1.4.2)**: Public `/experts/[slug]` pages with redesigned layout (intro video hero via `ExpertIntroMedia`, full bio, expertise pills, modalities teaser matching landing, trust signals, direct booking CTAs to existing flow). Landing directory names now deep-link to profiles. `introVideoUrl` surfaced in public expert data.
- Original spec (bio + intro video + product cards) delivered as the foundation; full three-modality cards will expand when modalities (D2.1) ship. Chris seed works via fallback; ready for additional experts like David with video/bio.

(See CHANGELOG 0.1.6.0 / 0.1.4.2 and `src/app/experts/`.)

### 4. XPRIZE evidence (T8)

- Structured Gemini decision logs export (`agent_id`, prompt hash, model, output summary).
- Stripe revenue export + judge test account + 3-minute demo storyboard.

### 5. GTM

- Inspired24 org pilot (discount codes vs credit bundle — open question).
- Landing copy pass: expert-network positioning, optional $1,600 event comparison.
- Scale roster toward 10 experts max, then shift to sales.

### 6. Transcript translation (D3 — Phases 1–3 shipped)

Cross-language expert sessions: live captions + localized recap. **Wedge/moat** — aerospace glossary, APX-02 context, canonical English audit trail.

- **Phase 0 (done):** Skill, cursor rule, roadmap, architecture, eng review, AI SDK review, case studies, `src/lib/transcript-translation/` types + token budget.
- **Phase 1 (done):** Daily WebVTT capture → `session_transcripts` → real APX-03 input via `selectTranscriptWindow()`.
- **Phase 2 (done):** `preferred_locale` + APX-06 recap translation (`es`, `pt-BR`, `fr`, `ja`).
- **Phase 3 (done, v0.1.5.0):** Live translated captions — `createCallObject()` UI, caption rail, `translate-segment` API.
- **Phase 4 (next):** Glossary expansion, APX-04 moderation, human interpreter escalation.

See [d3-transcript-translation-roadmap.md](./d3-transcript-translation-roadmap.md).

## Verify after D2 slices

1. Buyer completes each modality checkout → payout split visible in Stripe test mode.
2. Flagged intake appears in admin/compliance queue (when moderation ships).
3. Post-book redirect still opens brief panel for live sessions with pre-call add-on.
4. No user-facing "APX-*" strings in mentee, booking, or public routes.

## Repo map (D2 additions)

| Area | Path |
|------|------|
| Intake moderation stub | `src/lib/intake-moderation.ts` |
| Book API hook point | `src/app/api/book/route.ts` |
| Brief auto-open UX | `src/app/dashboard/mentee/mentee-dashboard-client.tsx` |
| Brief panel | `src/app/dashboard/mentee/briefing-sidebar.tsx` |
