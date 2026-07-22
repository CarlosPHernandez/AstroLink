# How to prove Daily transcription storage before a real session

You will leave with a **downloadable WebVTT** (or a hard stop if storage is off).
Live captions alone do **not** pass this preflight.

Read the postmortem first if you have not:
[Daily transcription storage incident](../explanation/daily-transcription-storage-incident.md).

## Prerequisites

- Daily domain for AstroLink (production or dedicated staging)
- `DAILY_API_KEY` with permission to read domain config and transcripts
- Ability to run one short two-person (or mentor + mentee) test call
- App env with `DAILY_TRANSCRIPTION_ENABLED=true` when testing the full product path
- Daily webhook subscribed to at least:
  - `meeting.ended`
  - `transcript.ready-to-download`
  - `transcript.error` (recommended)

## Why this exists

On 2026-07-21 a paid Chris campaign session finished with live captions and a
Daily transcript id in `t_finished` state, but **no WebVTT was ever stored**.
Domain property `enable_transcription_storage` was `false`. Post-call product
(transcript panel, grounded recap) had nothing to show. Enabling storage later
did not recover that call.

## Steps

### 1. Confirm domain storage is on

```bash
curl -sS -H "Authorization: Bearer $DAILY_API_KEY" \
  "https://api.daily.co/v1/" \
  | python3 -c "import sys,json; c=json.load(sys.stdin).get('config',{}); print('enable_transcription_storage=', c.get('enable_transcription_storage')); print('enable_transcription=', c.get('enable_transcription')); print('transcription_bucket=', c.get('transcription_bucket'))"
```

**Pass criteria:**

- `enable_transcription_storage=` **True** (or `true`)

If false, enable domain-wide (preferred for AstroLink so every room inherits it):

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.daily.co/v1/" \
  -d '{"properties":{"enable_transcription_storage":true}}'
```

Re-run the GET and confirm the flag flipped.

Optional: also set room property when provisioning
(`properties.enable_transcription_storage: true` on create/update room) so a
domain regression cannot silently break a single launch room. Domain-level is
the minimum bar.

### 2. Confirm app + webhook switches

| Switch | Where | Required value for durable transcript product |
|--------|--------|-----------------------------------------------|
| `DAILY_TRANSCRIPTION_ENABLED` | Vercel / `.env.local` | `true` |
| `DAILY_API_KEY` | same | present |
| `DAILY_WEBHOOK_HMAC` | same | matches Daily webhook `hmac` (base64) |
| Daily webhook URL | Daily dashboard / REST | `https://<prod-host>/api/webhooks/daily` |
| Webhook events | Daily | includes `transcript.ready-to-download` |

App flag starts STT and routes synthesis to the transcript-ready path. It does
**not** create storage.

#### Recover `DAILY_WEBHOOK_HMAC` (required — empty secret = every webhook returns 500)

Daily returns a base64 `hmac` when the webhook is **created**. It is not a separate
optional toggle. Without it in Vercel, `POST /api/webhooks/daily` fails immediately.

```bash
# List webhooks (note uuid, url, state, hmac, eventTypes)
curl -sS -H "Authorization: Bearer $DAILY_API_KEY" \
  "https://api.daily.co/v1/webhooks" | python3 -m json.tool

# Create if missing (save hmac from response immediately)
curl -sS -X POST \
  -H "Authorization: Bearer $DAILY_API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.daily.co/v1/webhooks" \
  -d '{
    "url": "https://www.astro-link.space/api/webhooks/daily",
    "eventTypes": ["meeting.ended", "transcript.ready-to-download", "transcript.error"]
  }' | python3 -m json.tool
```

Put the returned `hmac` value into Vercel Production as `DAILY_WEBHOOK_HMAC` (and
Preview if you test webhooks there). If `state` is `FAILED`, fix the endpoint (HMAC
must be set so probes get 200), then re-activate via Daily’s update webhook API.

**Admin reclaim** (webhook miss but VTT exists):  
`POST /api/admin/bookings/<bookingId>/reclaim-transcript` with body
`{ "transcriptId": "<Daily transcript id>" }` as an admin session.

### 3. Run a rehearsal call (≥2–3 minutes of real speech)

1. Book or fulfill a non-production booking (or a throwaway confirmed booking).
2. Join as mentor and mentee; ensure mentor owner starts transcription
   (`DAILY_TRANSCRIPTION_ENABLED=true`).
3. Speak clearly for a few minutes (enough that STT produces multiple cues).
4. Hang up cleanly so Daily can finalize the transcript job.

### 4. Locate the transcript id

```bash
curl -sS -H "Authorization: Bearer $DAILY_API_KEY" \
  "https://api.daily.co/v1/transcript?limit=10" \
  | python3 -m json.tool
```

Find the row for your room name (`astrolink-<booking prefix>`). Note
`transcriptId` and `status` (`t_finished` expected when done).

### 5. Prove download (this is the real gate)

```bash
TID="<transcriptId from step 4>"

curl -sS -H "Authorization: Bearer $DAILY_API_KEY" \
  "https://api.daily.co/v1/transcript/${TID}/access-link"
```

**Pass criteria:**

- JSON includes `download_link` or `link`
- Fetching that URL returns **WebVTT** text containing spoken lines (not empty)

```bash
# Example: open the link returned above
curl -sS "<download_link from access-link response>" | head -40
```

**Fail criteria (stop the launch):**

```text
Transcriptions not stored for …
consider "enable_transcription_storage"
```

If you see that after step 1 claimed storage is on, check **room** properties for
the test room and re-run a **new** call (old jobs without storage never grow a VTT).

### 6. Prove AstroLink persistence

After webhook processing (or operator retry in non-prod):

```sql
-- Hosted Supabase SQL editor (service role / dashboard)
SELECT id, daily_transcript_id,
       length(coalesce(vtt_text, '')) AS vtt_len,
       jsonb_array_length(coalesce(utterances_json, '[]'::jsonb)) AS utterance_count,
       created_at
FROM session_transcripts
WHERE booking_id = '<booking-uuid>';
```

**Pass criteria:** `vtt_len > 0` and `utterance_count > 0`.

Optional product checks:

- `GET /api/session/<bookingId>/transcript` as a participant returns utterances
- Recap is not the empty-transcript apology template when synthesis ran with real input

Dev-only without Daily storage: `simulate_transcript_ready` on
`POST /api/dev/session-operator` ingests a fixture VTT. That **does not** prove
production Daily storage.

## Verification (checklist copy-paste)

- [ ] Domain `enable_transcription_storage` is true
- [ ] `DAILY_TRANSCRIPTION_ENABLED=true` in the environment that will host the call
- [ ] Webhook includes `transcript.ready-to-download` (+ HMAC verified once)
- [ ] Rehearsal call produced `t_finished` transcript id
- [ ] `access-link` returned a downloadable WebVTT with real speech
- [ ] `session_transcripts` row has non-empty `vtt_text` / utterances
- [ ] No launch claim of “transcript after the call” without the above

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Captions work in-call; access-link “not stored” | Storage never on for that meeting | Enable storage; run a **new** call; old ids stay empty |
| No transcript id in list | STT never started | Mentor owner join + `DAILY_TRANSCRIPTION_ENABLED`; domain `enable_transcription` |
| Transcript id exists; webhook never fired | Webhook misconfigured | Dashboard URL/events/HMAC; check Vercel logs for `/api/webhooks/daily` |
| Webhook fired; no `session_transcripts` row | access-link failed or handler error | Logs for `Daily transcript access-link failed`; fix storage then re-trigger |
| `session_transcripts` empty; booking `completed` | Complete-on-leave without transcript path | Status alone is not success; re-run storage preflight |
| access-link works; recap still generic | Synthesis skipped or empty window | Check APX-03 / `sessions.summary_json`; synthesis gate eligibility |
| Only fixture path works locally | Never tested real Daily download | Steps 4–5 are mandatory before paid traffic |

## Recovery if storage was off during a real call

1. Accept that Daily will not retroactively create a VTT for that `transcriptId`.
2. Check for cloud recordings (`GET /v1/recordings`). If none, there is no
   offline re-STT source from Daily.
3. Ask participants for notes or any local recording (only with appropriate consent).
4. Do **not** invent a transcript in the product UI.
5. Enable storage immediately and re-run this preflight before the next paid session.

## Related

- [Explanation: storage incident](../explanation/daily-transcription-storage-incident.md)
- [Reference: video session](../reference/video-session.md)
- [How to: video session demo](./video-session-demo.md)
- [Chris campaign launch checklist](./chris-campaign-launch-checklist.md)
- Daily docs: [Transcription storage](https://docs.daily.co/docs/guides/features/transcription)
