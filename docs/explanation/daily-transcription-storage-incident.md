# Live captions are not a stored transcript

**Incident date:** 2026-07-21  
**Booking:** Chris Sembroski × mentee (room `astrolink-9d2605305f6345eab533`)  
**Severity:** Data loss for product surface that was treated as shipped  
**Status:** Domain storage enabled after the fact; **this call’s text is unrecoverable**

This document explains a real production failure so the next engineer does not ship
“transcripts work” when only live captions work.

## The problem

We ran a paid, high-stakes expert session with Daily real-time transcription on.
Participants could see live speech-to-text. After the call we expected:

1. A Daily WebVTT file for the meeting
2. A `session_transcripts` row in Supabase
3. Post-session recap (APX-03) grounded in what was actually said
4. Post-call transcript UI on `/session/[bookingId]`

We got none of the text. Daily still listed a finished transcript **job**
(`status: t_finished`, ~44.5 minutes). The access-link API refused download:

```text
Transcriptions not stored for <transcriptId>.
consider "enable_transcription_storage" domain/room property
```

AstroLink had **zero** rows in `session_transcripts` and no usable `sessions`
artifact for that booking. There were also **no** Daily cloud recordings
(`GET /v1/recordings` empty), so there was nothing to re-transcribe offline.

Turning `enable_transcription_storage` **on after the call does not backfill**
past meetings. Metadata remains; the words never left Daily’s live stream path.

## What people confuse (and why that ships bugs)

Daily has two different products that look like “transcription” in demos:

| Capability | What it does | Survives hang-up? | Feeds AstroLink post-session? |
|------------|--------------|-------------------|-------------------------------|
| **Live transcription** (`startTranscription`, captions UI) | Streams STT to participants in-call | No (ephemeral unless storage is on) | Only if WebVTT was **stored** and later fetched |
| **Transcription storage** (`enable_transcription_storage`) | Persists the meeting as WebVTT (Daily cloud or custom bucket) | Yes | Yes — required for `fetchDailyTranscriptVtt` |
| **App flag** `DAILY_TRANSCRIPTION_ENABLED=true` | Our code auto-starts STT on mentor join; routes APX-03 to `transcript.ready` | N/A (app behavior only) | Necessary but **not sufficient** |

App env true + live captions working **proves almost nothing** about durable
storage. The green path people demo in the room is the live stream. The green
path product needs after the room dies is the WebVTT.

```
  In-call                          After hang-up
  ──────                           ─────────────
  startTranscription ──► captions   enable_transcription_storage=true
       │                    UI              │
       │                                    ▼
       │                          Daily WebVTT (stored)
       │                                    │
       │                         transcript.ready-to-download
       │                                    │
       │                                    ▼
       │                     fetchDailyTranscriptVtt()
       │                     → session_transcripts
       │                     → APX-03 / recap / transcript panel
       │
       └── if storage is false ──► job may finish, download fails forever
```

## What our code assumes

Post-session Phase 1 is hard-wired to Daily’s **stored** transcript:

1. Webhook `transcript.ready-to-download` → `fulfillBookingAfterTranscriptReady`
   (`src/lib/post-session.ts`)
2. `fetchDailyTranscriptVtt(transcriptId)` calls
   `GET /v1/transcript/{id}/access-link`, then downloads the signed URL
   (`src/lib/transcript-translation/fetch-daily-transcript.ts`)
3. Parse WebVTT → map speakers → insert `session_transcripts`
4. Synthesis gate runs APX-03 on the English window

If step 2 fails, nothing durable exists for operators to scrape. Live caption
segments are **not** written to Supabase during the call (by design: captions
are ephemeral UX + translation, not the compliance/canonical store).

## Root cause (system, not one bad commit)

Several gaps stacked:

1. **Domain default:** Daily domain config had
   `enable_transcription_storage: false` (and `transcription_bucket: null`).
2. **Room provision path:** `createDailyRoomForBooking` did not set
   `enable_transcription_storage` on room properties, so rooms inherited the
   domain default.
3. **Go-live checklists** stressed `DAILY_TRANSCRIPTION_ENABLED`, webhooks, and
   “transcription enabled,” but not an explicit **download proof** of a real
   access-link after a rehearsal call.
4. **False confidence:** Captions during the call, a finished transcript id in
   `GET /v1/transcript`, and booking `status=completed` all look healthy while
   the body is missing.
5. **No recording fallback:** Cloud recording was not enabled; recovery options
   collapsed to “ask participants for notes.”

This is a **shipped incomplete pipeline** failure, not a flaky webhook alone.
Even a perfect `transcript.ready` webhook cannot invent a VTT Daily never stored.

## Incident timeline (ops view)

| Time (approx, UTC) | Event |
|--------------------|-------|
| 2026-07-21 ~19:00 | Call starts; Chris + mentee join; admin later joins as visible observer |
| ~19:00–19:45 | Live transcription runs; ~2674s meeting duration |
| After hang-up | Booking marked `completed` via leave/complete path |
| Post-call | Daily transcript list shows `t_finished` for room `astrolink-9d260530…` |
| Post-call | `access-link` → not stored; Supabase `session_transcripts` count = 0 |
| Same day | Domain `enable_transcription_storage` set `true` for **future** calls |
| Same day | Re-fetch access-link still fails for this transcript id (no retroactive store) |

## Trade-offs (why storage is not free, but is non-optional for us)

| Choice | Gain | Cost |
|--------|------|------|
| Storage off (Daily default) | Less retained speech data; lower storage surface | **No product transcript, no grounded recap, no post-call panel** |
| Storage on (Daily cloud) | WebVTT downloadable; pipeline as designed | Retained sensitive conversation text; privacy/ToS duty |
| Custom `transcription_bucket` | Data residency / own S3 | Ops complexity (bucket IAM, retention) |
| Also record audio/video | Offline re-transcribe if STT storage fails | Much higher sensitivity; marketing/consent constraints |

For AstroLink’s D3 wedge (canonical English transcript, recap, bilingual panel),
**storage on is a launch requirement**, not a nice-to-have. If privacy policy
forbids retention for a given campaign, turn transcription **and** product
promises off together — do not ship half.

## Alternatives considered after the loss

| Option | Result |
|--------|--------|
| Enable domain storage and re-download | Failed; content never persisted |
| Alternate Daily download endpoints | 404 / same not-stored error |
| Re-run post-session webhook handler | No VTT to fetch |
| Pull cloud recording and re-STT | No recordings exist |
| Reconstruct from live caption API history | Not persisted server-side |

Only human notes or a participant-side recording could recover content for
**that** call.

## Lessons (write these into checklists, not only memory)

1. **Demo the artifact, not the feature name.** Before any paid session with
   transcription marketing, complete a rehearsal and prove:
   - `session_transcripts.vtt_text` non-empty **or**
   - Daily `access-link` returns a downloadable WebVTT with spoken content.
2. **Three switches, all required:** domain/room `enable_transcription_storage`,
   app `DAILY_TRANSCRIPTION_ENABLED`, webhook `transcript.ready-to-download`.
3. **`t_finished` ≠ downloadable.** Treat transcript list metadata as
   non-evidence until access-link works.
4. **Completing a booking is not fulfilling a transcript.** Leave-to-complete
   and `meeting.ended` can finish the money/status path without any words stored.
5. **Patch provisioning or domain before go-live**, not after the celebrity call.
6. **If storage is off, product copy must not promise “you’ll get a transcript.”**

## Related

- [How to: Daily transcription storage preflight](../how-to/daily-transcription-storage-preflight.md)
- [Reference: video session](../reference/video-session.md) (env + domain properties)
- [How to: video session demo](../how-to/video-session-demo.md)
- [How to: Chris campaign launch checklist](../how-to/chris-campaign-launch-checklist.md)
- [Explanation: transcript translation architecture](./transcript-translation-architecture.md)
- Code: `src/lib/transcript-translation/fetch-daily-transcript.ts`,
  `src/lib/post-session.ts` (`fulfillBookingAfterTranscriptReady`)
