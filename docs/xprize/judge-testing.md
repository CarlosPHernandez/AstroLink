# Judge testing (live site)

Production is `APP_MODE=full` at https://www.astro-link.space/.

## Locked metrics (2026-08-15)

- Arms-length revenue: **$144** (one paying customer, live Stripe, no related-party, no test charges)
- Users: **36** early-access registrations, **1** completed Path Assessment, **1** consented review
- Marketing: **$0**
- Take rate: **20%** platform / **80%** expert
- Costs: Stripe fee, Supabase Pro, Vercel Pro
- LLM: Production uses `LLM_PROVIDER` (Gemini when set to `gemini`). Matching is not Gemini-branded if the provider is still OpenAI.
- Daily `enable_transcription_storage`: **true**
- Repo: private until submission, then public
- Team: 3 people, 1 full-time

## Golden path

1. `/assessment` — complete the quiz. If Gemini succeeds, results show a **Gemini matched you to {Expert}** card and **Book {Name}**. If the model fails, a **template report** banner is shown (do not treat that as a Gemini decision).
2. **Default book path is APX-01 match:** go to `/booking` with no `?mentor=`. Enter goals + background + time, then **Match me and continue**. The configured LLM picks a listed expert. Browse (`Choose an expert yourself`) still works and is explicit selection, not a match. If Production `LLM_PROVIDER=gemini`, this is a Gemini decision.
3. Earliest bookable day is **today + 2 Eastern calendar days**.
4. After payment, mentee dashboard shows the dual brief (APX-02).
5. Join `/session/[id]` at scheduled start (set `DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES=15` on Production if judges need early join).
6. After hang-up, Gemini settlement writes `session_settlements` (completed / no-show / hold). Recap appears **only** if a stored transcript exists.

## Do not claim

- Browse-selected bookings are AI-matched (`mentorId` present → `matchedByGemini: false`)
- Intake/ITAR auto-block (`screenBookingIntake` is still a stub)
- Onboard NF-1860 is auto-audited by an agent
- A recap without `transcript_available`
