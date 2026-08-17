# Tech-to-CEO brief — bilingual captions and paid-path fixes

**Audience:** Founder / CEO  
**Date:** 2026-08-17  
**Ask:** Awareness. Mentor-in-Spanish captions is still a later product call.

---

### 1. One-sentence outcome

Spanish and English speakers in the same live call were getting the *wrong* captions (or none). We fixed the decision of “who to translate for whom,” and we wrote this so you can talk about it without reading the code.

---

### 2. Why this matters for the business

- **Trust in the room.** If a Spanish buyer hears English and the captions stay in Spanish — or get garbled — they stop believing the product. That is a lost session and a lost review.
- **The bilingual promise.** We sell access across language, not just video. Broken captions make that a claim, not a product.
- **XPRIZE / demo risk.** Judges and buyers will talk over each other. That was exactly when we dropped or inverted languages.
- **Paid path we already shipped.** Match, settlement, and refund bugs were the same class of problem: the system looked smart until money or a live demo hit an edge.

---

### 3. Current state vs. desired state

| Before (what a user saw) | After (what they should see) |
|--------------------------|------------------------------|
| Spanish mentee talks; English expert sees raw Spanish | Expert sees English captions of the mentee |
| Spanish mentee sees their *own* line “translated” into nonsense | They see their own Spanish, untouched |
| A short “ok” / “sí” with no language tag was treated as English | Missing tag uses “who is speaking,” not a fake English default |
| Overlap (both talk) dropped the other person’s line | We keep both speakers; we wait a bit longer before dropping |
| Speech-to-text failed and silently switched to English-only | We retry bilingual STT or say captions are unavailable — we do not fake English |
| Gemini on Production was historically OpenAI after a July outage | You confirmed Gemini is live again. Submission copy now says that. |

**Paid-path fixes already on main (same honesty bar):** Gemini match is the default book path; we do not invent a recap without a transcript; failed Chris payments release the slot; we do not refund fake payment ids; complimentary sessions redeem before they confirm free.

---

### 4. Key trade-offs

- **Accuracy vs. complexity.** We did *not* add a second language-detection model. We used “translate the other person into your language.” Faster, fewer wrong translations of your own speech.
- **Speed vs. completeness.** We still translate only finished sentences (cheaper). Overlap is visible as original text first, then translation.
- **Mentor always English.** A Spanish-speaking expert still gets English captions. That is the v1 product rule. Changing it is a settings change, not this fix.
- **If the buyer never set “Spanish” on their profile** and Deepgram also stays silent, we can still miss. They should set locale in settings, or we detect it from their first few lines in a later pass.

---

### 5. What “8/10 production grade” means here

**In:** Other person’s speech → your language. No fake “this was English.” No silent English-only fallback. Loading lines are not marked “translated.” Rate-limit pause retries the last few lines.

**Out:** Perfect word-level timing. Translating the expert into Spanish. Instant captions while someone is still mid-sentence. Auto-detecting locale if the buyer left settings on English.

Good enough to sit in a bilingual session and not be embarrassed. Not as good as Zoom’s caption team.

---

### 6. Specific ask

None required. Optional later: “Should Spanish-speaking experts get captions in Spanish?” That is a product call.

---

### Language confirm (same branch)

Spanish buyers almost never open Settings. The profile language defaults to English, so captions still thought they were English.

**Fix:** before the video starts, one screen: “Captions and recap will be in [language].” We guess from the browser (Spanish Chrome → Español) but they can change it. Continue saves that to their profile. We do **not** flip language mid-call from a single “sí.”

If save fails, they still join with the language they picked. If the browser is German, we stay on English (we do not caption German).

---

### 7. Next (visible progress)

- Code on `feat/live-caption-bilingual-direction` (this work).
- After merge: one dual-device call (Spanish + English) is the proof. Say two sentences each, then talk over each other once.
- XPRIZE copy now states Production Gemini is live. Still attach a usage screenshot + one audit row with `provider: gemini` for judges.

---

### Other bug fixes, same language

These already shipped (v0.14.1–0.14.2). One line each:

| What broke for a human | What we did |
|------------------------|-------------|
| Booking asked you to pick an expert first; “AI match” was unused | `/booking` now matches from goals; browse is optional |
| Assessment said “book a review” even after Gemini named someone | Button says **Book {Name}** |
| Empty call still invented a “recap” | Recap only if we stored a transcript |
| Failed Chris payment still ate the last slot | Slot is released |
| Cancel of a free session called Stripe and 500’d | We only refund real Stripe ids |
| Complimentary session could confirm free twice | We consume the grant before confirming |
