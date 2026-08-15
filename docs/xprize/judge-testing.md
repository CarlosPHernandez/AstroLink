# Judge testing (live site)

Production is `APP_MODE=full` at https://www.astro-link.space/.

## Locked metrics (2026-08-15)

- Arms-length revenue: **$144** (one paying customer, live Stripe, no related-party, no test charges)
- Users: **36** early-access registrations, **1** completed Path Assessment, **1** consented review
- Marketing: **$0**
- Take rate: **20%** platform / **80%** expert
- Costs: Stripe fee, Supabase Pro, Vercel Pro
- LLM: **OpenAI** in Production until Vertex/Gemini billing is flipped (`LLM_PROVIDER` must stay explicit)
- Daily `enable_transcription_storage`: **true**
- Repo: private until submission, then public
- Team: 3 people, 1 full-time

## Golden path

1. `/assessment` — complete the quiz. If Gemini/OpenAI succeeds, results show a **Gemini matched you to {Expert}** card. If the model fails, a **template report** banner is shown (do not treat that as a Gemini decision).
2. Book the matched expert (`?assessment=` + `?mentor=`). Earliest bookable day is **today + 2 Eastern calendar days**.
3. After payment, mentee dashboard shows the dual brief (APX-02).
4. Join `/session/[id]` at scheduled start (set `DAILY_ROOM_JOIN_WINDOW_BEFORE_MINUTES=15` on Production if judges need early join).
5. After hang-up, Gemini settlement writes `session_settlements` (completed / no-show / hold). Recap appears **only** if a stored transcript exists.

## Do not claim

- Every booking is AI-matched (named-expert browse still sends `mentorId`)
- Intake/ITAR auto-block (`screenBookingIntake` is still a stub)
- Onboard NF-1860 is auto-audited by an agent
- A recap without `transcript_available`
