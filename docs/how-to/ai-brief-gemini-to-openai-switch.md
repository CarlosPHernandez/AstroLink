# AI Brief Provider Switch: Gemini → OpenAI (Launch Decision Record)

**Date:** 2026-07-08  
**Context:** Live production testing of Chris Sembroski campaign (real-money bookings at $1 test price, then production pricing).  
**Decision:** Temporarily set `LLM_PROVIDER=openai` in Vercel Production to unblock reliable AI briefing generation.  
**Status:** Reversible. Gemini remains the preferred long-term provider.

## What Happened

During end-to-end live tests:

- Payment succeeded (Stripe immediate-capture PI confirmed via client + webhook path).
- Booking row created with `status='confirmed'`.
- `transactions` row inserted.
- Campaign slot consumed.
- "You're booked with Chris" email sent via Resend.
- **But** the AI briefing (APX-02) failed to generate.

Error surfaced from the Gemini backend (via our `formatLlmError` wrapper):

```json
{
  "error": {
    "code": 429,
    "message": "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. Learn more at https://ai.google.dev/gemini-api/docs/billing#prepay.",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

Wrapped as:  
`— LLM quota/rate limit hit. Retry later or switch provider via LLM_PROVIDER.`

This was **not** our internal rate limiter (`LLM_MAX_REQUESTS_PER_USER_HOUR=5`). It was Google's production billing enforcement.

See:
- `src/lib/llm.ts` (error formatting + `callLlmWithBackoff` + provider selection)
- `src/services/agents/briefing-agent.ts` (dual-session briefing for 1:1 sessions, keyed to `mentee_id`)
- `src/lib/post-payment.ts` (`runConfirmedBookingFulfillment` called after payment success)

## Why Gemini Prepaid Credits Depleted

- Gemini (Google AI Studio / generative AI) uses a **prepaid credits** model for production usage.
- Free tier / AI Studio keys have very low limits (RPM, daily tokens, etc.) — unsuitable for even moderate real-user volume.
- Our key had been used for development + repeated live test bookings (Chris campaign + other brief generations).
- No sustainable "free forever" path exists for a paid service generating multiple briefs per hour/day.

We confirmed by direct API response + the linked billing page.

## Business Context & Rationale

AstroLink is operating as a **real business**, not a demo:

- Early-access / Chris campaign bookings are **paid** (real cards, real money moved via Stripe).
- Customers expect a working product: confirmed booking + useful AI-generated brief + email.
- AI briefing is a core part of the value proposition (APX-02).

**Cost model we are using:**
- The booking fee (platform revenue) covers the marginal cost of the AI brief.
- AI is a fulfillment cost (like Daily room provisioning), not free.
- We log every LLM call with provider, model, tokens, and estimated cost so we can attribute expenses against revenue.

See enhanced logging:
- `src/lib/llm-audit.ts` (LlmUsage + estimatedCostCents)
- `src/lib/llm.ts` (now captures `usageMetadata` from Gemini and `usage` from OpenAI, stores in `audit_log` as `LLM_DECISION`)
- Every briefing call (via `generateStructuredJson` with `audit` context) produces an auditable row.

This gives us transparent evidence of:
- Which provider was used for which booking
- Actual token consumption
- Rough cost per brief
- That we are subsidizing AI from platform fees

## Decision: Switch to OpenAI Temporarily

**Action taken:**
- Set `LLM_PROVIDER=openai` (and ensure `OPENAI_API_KEY`) in Vercel **Production** environment variables.
- Redeploy.

**Why OpenAI?**
- Immediate reliability for paying customers.
- Codepath already fully supports it (`getLlmProvider()`, model selection, structured JSON, usage logging, audit).
- OpenAI keys are pay-as-you-go (no prepaid credit cliff for this scale).
- Quality of briefs remains high (we use `gpt-4o` / `gpt-4o-mini` equivalents when provider=openai).

**Gemini is not abandoned:**
- We still default to / prefer Gemini when credits/budget allow (`LLM_PROVIDER=gemini` or unset + no OpenAI key).
- The XPRIZE / "Build with Gemini" positioning can continue (we can note "primarily powered by Google Gemini with fallback for production reliability").
- Once we allocate budget from real platform revenue, we can switch back (or run hybrid).

We are treating AI costs as a real business expense, logged and attributed.

## Evidence (for future reference / XPRIZE / investors / accounting)

1. Gemini error payload (above) + timestamped Vercel logs.
2. `audit_log` rows with `event='LLM_DECISION'` showing Gemini usage before depletion.
3. Stripe transaction + booking records proving real paid volume.
4. This document + the commit that added usage/cost logging.
5. Vercel env var change history (LLM_PROVIDER switch).
6. After switch: new `LLM_DECISION` rows will show `provider: 'openai'` + token counts + estimated costs.

**Rough cost math (for context):**
- A typical Chris briefing is one structured JSON call.
- Gemini flash / OpenAI mini: usually well under $0.10 per brief at current volumes.
- Easily covered by even the discounted Chris launch price.

## How to Revert to Gemini Later

1. Top up / set up proper billing for the Gemini project at https://ai.studio/projects.
2. In Vercel Production:
   - `LLM_PROVIDER=gemini`
   - (Keep `OPENAI_API_KEY` if you want fallback logic later.)
3. Redeploy.
4. Monitor first few briefs via `audit_log` + Stripe revenue.

Optional future improvement: automatic fallback in `callLlmWithBackoff` / briefing agent on `RESOURCE_EXHAUSTED` (log which provider was ultimately used).

## Notes on Free Usage

- There is **no practical free tier for production paid service volume**.
- AI Studio free keys are rate-limited and intended for experimentation / low-volume personal use.
- Using them for customer-facing paid bookings would lead to exactly the failures we saw (and potential ToS issues).
- We are being transparent and logging everything so we can properly account for AI costs against platform revenue.

---

**Related files:**
- `src/lib/llm.ts`
- `src/lib/llm-audit.ts`
- `src/services/agents/briefing-agent.ts`
- `src/lib/post-payment.ts`
- `.env.example` (LLM_PROVIDER, keys, rate limit comments)
- Vercel Production environment variables (source of truth for the switch)

This document serves as the official record of the business-driven provider decision during early paid operations.