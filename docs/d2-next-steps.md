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

- Public URL: bio, intro video, three product cards (Live · Recorded · Text) with expert-set prices.
- Chris template first; onboard experts #2–#4 on same pipeline.

### 4. XPRIZE evidence (T8)

- Structured Gemini decision logs export (`agent_id`, prompt hash, model, output summary).
- Stripe revenue export + judge test account + 3-minute demo storyboard.

### 5. GTM

- Inspired24 org pilot (discount codes vs credit bundle — open question).
- Landing copy pass: expert-network positioning, optional $1,600 event comparison.
- Scale roster toward 10 experts max, then shift to sales.

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
