# Tutorial: Bidirectional live captions on two devices

By the end of this tutorial you will run a live video session where each participant sees the other person's speech translated into their own language, then review the post-call transcript panel.

**Time:** ~20 minutes  
**Prerequisites:** [First video session](./first-video-session.md) completed, `DAILY_API_KEY` set, transcription enabled on your Daily domain

## What you'll need

| Variable / tool | Value |
|-----------------|-------|
| `DAILY_TRANSCRIPTION_ENABLED` | `true` in `.env.local` |
| `OPENAI_API_KEY` or `GEMINI_API_KEY` | Required for real translation (not stub) |
| Two browsers or laptop + phone | Phone needs HTTPS — use `npm run dev:lan` |
| Demo accounts | Mentee `carlos@astrolink.ai`, mentor `chris@astrolink.ai` |

Enable transcription in the [Daily dashboard](https://dashboard.daily.co/) for your domain before starting.

## Step 1: Set locales and start the dev server

1. Sign in as Carlos and open **Mentee settings** (`/dashboard/mentee/settings`).
2. Set **Preferred language** to `es` (Spanish).
3. Start the LAN dev server so your phone can use camera/mic:

   ```bash
   npm run dev:lan
   ```

4. Note the HTTPS URL printed in the terminal (e.g. `https://192.168.1.42:3000`).

**What happened:** The mentee's `preferred_locale` drives caption target language. `dev:lan` serves HTTPS on your LAN IP, which mobile browsers require for media permissions.

## Step 2: Book and join from two sides

1. On your laptop, book Chris and open `/session/{bookingId}` as Carlos (mentee).
2. Before the call mounts, confirm **Captions and recap language**. If the profile is still English, we guess from the browser (`[data-testid="caption-language-guess"]`). Change the select if the guess is wrong, then **Continue to call**. That saves via `POST /api/me/preferred-locale` (the call still starts if save fails).
3. On your phone (or a second browser profile), open the same LAN URL, sign in as Chris, and join the same session.

**What you should see:** Both sides reach `[data-testid="session-join-ready"]`. After the mentee confirms language, the header can show **Captions on for {buyer} ({locale})** whenever transcription is on — including English buyers who still need the other person's speech translated.

## Step 3: Turn on captions and speak

1. On the mentee device, toggle the caption rail on (below the video band).
2. On the mentor device, speak a short English sentence (e.g. "We should review the RPO maneuver timeline").
3. Within ~2 seconds, the mentee should see a Spanish translation line in the caption rail.

**Verification:** Caption lines appear with speaker attribution. If translation is slow, check the browser network tab for `POST .../translate-segment` responses.

## Step 4: Test the pause banner (optional)

If you hit LLM rate limits during a long demo, the rail shows **Live translation paused — showing original speech** instead of a red error badge. Original text still appears; translation resumes automatically when the rate-limit window clears.

For local tuning, see [Live caption rate limits](../explanation/live-caption-rate-limits.md) and `LLM_MAX_CAPTION_*` in `.env.example`.

## Step 5: End the call and open the transcript panel

1. Hang up inside Daily's UI on both devices.
2. Wait for the booking to reach **completed** (webhook or dev `simulate_meeting_ended`).
3. Reopen `/session/{bookingId}` as the mentee.

**What you should see:** A transcript panel listing utterances from the call, with a toggle to view localized text.

## What you built

You exercised the full D3 Phase 3 path:

- Join-time language confirm (browser guess when the profile is still `en`)
- Daily `multi` + `nova-3` transcription on owner join (retries bilingual STT; no silent English-only fallback)
- Other-person translate direction (missing STT language tag is not treated as English)
- Caption rail with graceful pause on rate limits
- Post-call transcript fetch and batch translate

## Next steps

- [How to: investor demo runbook](../how-to/video-session-demo.md) — live captions section and failure cheatsheet
- [Reference: video session APIs](../reference/video-session.md) — `translate-segment`, transcript routes, env vars
- [Explanation: live caption rate limits](../explanation/live-caption-rate-limits.md) — queue, budgets, sustained speech
- [Explanation: transcript architecture](../explanation/transcript-translation-architecture.md) — end-to-end data flow
