# Expert onboarding and offer wizard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give AstroLink one public, marketable path for new experts, and one standard offer (hourly price, weekly hours, services) that buyers and booking both read from the same server rules.

**Architecture:** Strangers apply at `/for-experts`. That writes an `expert_applications` row and nothing else. An admin approves it by creating an unlisted mentor through the existing `createOrUpdateMentor` helper and the existing invite/activation flow. The activation wizard and mentor settings gain two steps, Services and Hours, saved by `PATCH /api/mentor/offer`. `live_session_price_cents` stays the hourly rate. Booking keeps today's behavior when an expert has no saved hours. After they save at least one window, new bookings must fall inside those windows.

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod, Supabase (service role), Vitest, Playwright for the public apply page only. Visual source of truth: `DESIGN.md` (Montserrat, `--landing-*` tokens on the marketing page; existing `activate-flow.css` on the wizard).

## Global Constraints

- Directory listing stays `compliance_status = 'approved' AND is_listed = true`. Apply and the wizard must not set `is_listed`.
- Hourly rate bounds match the mentor dashboard: whole dollars, minimum $1, maximum $10,000, stored as cents (`rate * 100`).
- Service ids are only the existing enum: `session_1on1`, `pre_call_brief`, `extended_session`. Personal video stays `video_requests_enabled` plus `video_request_price_cents` (0–50000 cents, SLA days 3–14).
- Empty `mentor_availability_windows` means grandfathered: booking does not filter by hours. One or more windows means every new `scheduled_at` must sit inside a window in that mentor's IANA timezone, still subject to `isScheduledAtOnOrAfterEarliestBookable`.
- Public apply accepts JSON only. No file upload. Civil-servant PDF stays on the authenticated mentor NF-1860 path.
- Marketing copy must not promise a listing, a job, intros, or income. One sentence on the page and in the confirmation: "AstroLink reviews every application before an expert appears in the directory."
- Marketing page uses the `/for-educators` shell: `LandingHeader`, `landing-mission`, `--landing-*` tokens, Montserrat. No satellite icon, no HUD, no star field.
- Wizard UI reuses `ActivateBrandHeader`, `ActivateStepProgress`, `ActivateCard`, and `activate-flow.css`. Do not extend `src/app/onboard/onboard-client.tsx`.
- Mutations use `requireApiRole('admin')` or `requireActivatedMentor()`. Public `POST /api/expert-applications` is the only unauthenticated route in this plan.
- No new env flag.

---

## What exists today

- `/onboard` collects employer, expertise, bio, and civil-servant status, then `onboardMentorAction` sets a demo cookie and redirects. It does not insert a `mentors` row. Leave that page alone in this plan.
- Ops creates experts in the admin panel via `POST /api/admin/mentors` → `createOrUpdateMentor` (`src/lib/admin-create-mentor.ts`).
- Invited experts finish `/activate/setup`: Welcome, Identity, Password, Profile (includes hourly rate), Payouts, Done. No services toggle. No hours.
- Buyers pick any future time that passes lead time (`src/lib/booking-lead-time.ts`). `BookingAgent` does not read a weekly schedule.
- `ProfileSchema` in `src/app/dashboard/mentor/actions.ts` is the price contract to copy, not a second policy.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/expert-offer/schema.ts` | Zod schemas and pure window matching |
| `src/lib/expert-offer/schema.test.ts` | Pass/fail unit tests for price, services, hours, slot fit |
| `src/lib/expert-offer/applications.ts` | Insert application, list, approve |
| `src/lib/expert-offer/offer.ts` | Read/write offered services, video flag, windows for one mentor |
| `supabase/migrations/20260924120000_expert_applications_and_hours.sql` | Tables and column |
| `src/app/api/expert-applications/route.ts` | Public submit |
| `src/app/api/admin/expert-applications/route.ts` | Admin list + approve |
| `src/app/api/mentor/offer/route.ts` | Mentor read/update offer |
| `src/app/for-experts/page.tsx` | Marketing page |
| `src/components/for-experts/apply-form.tsx` | Apply form client |
| `src/components/activate/offer-steps.tsx` | Services + hours fields used by activate and dashboard |
| `src/services/agents/booking-agent.ts` | Reject bookings outside saved windows |
| `e2e/for-experts-apply.spec.ts` | Public apply happy path and validation |

---

### Task 1: Offer schema and window matching

**Files:**
- Create: `src/lib/expert-offer/schema.ts`
- Test: `src/lib/expert-offer/schema.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `ExpertApplicationSchema` → `{ fullName, email, employer, expertise, bio, hourlyRateDollars, services, videoRequest, timezone, windows, isCivilServant }`
  - `MentorOfferSchema` → `{ hourlyRateDollars, services, videoRequest, timezone, windows }`
  - `windowContains(windows, timezone, scheduledAtIso, durationMinutes) → boolean`
  - `OFFERED_SERVICE_IDS = ['session_1on1', 'pre_call_brief', 'extended_session'] as const`
  - `MAX_WINDOWS = 14`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  ExpertApplicationSchema,
  MentorOfferSchema,
  windowContains,
} from '@/lib/expert-offer/schema';

const validWindow = { weekday: 2, startMinute: 9 * 60, endMinute: 12 * 60 };

describe('ExpertApplicationSchema', () => {
  const base = {
    fullName: 'Avery Quinn',
    email: 'avery@example.com',
    employer: 'JSC',
    expertise: 'Guidance, navigation',
    bio: 'Ten years on crewed vehicle guidance.',
    hourlyRateDollars: 150,
    services: ['session_1on1'],
    videoRequest: { enabled: false },
    timezone: 'America/Chicago',
    windows: [validWindow],
    isCivilServant: false,
  };

  it('accepts a complete application', () => {
    expect(ExpertApplicationSchema.parse(base).email).toBe('avery@example.com');
  });

  it('rejects an hourly rate of 0', () => {
    const parsed = ExpertApplicationSchema.safeParse({ ...base, hourlyRateDollars: 0 });
    expect(parsed.success).toBe(false);
  });

  it('rejects an unknown service', () => {
    const parsed = ExpertApplicationSchema.safeParse({
      ...base,
      services: ['coaching'],
    });
    expect(parsed.success).toBe(false);
  });

  it('requires a video price when video is enabled', () => {
    const parsed = ExpertApplicationSchema.safeParse({
      ...base,
      services: [],
      videoRequest: { enabled: true },
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an overnight window', () => {
    const parsed = ExpertApplicationSchema.safeParse({
      ...base,
      windows: [{ weekday: 1, startMinute: 22 * 60, endMinute: 2 * 60 }],
    });
    expect(parsed.success).toBe(false);
  });
});

describe('windowContains', () => {
  it('accepts a 25-minute session that starts and ends inside Tuesday 09:00–12:00 Chicago', () => {
    // 2026-09-29 is a Tuesday. 15:00Z = 10:00 America/Chicago (CDT, UTC-5).
    expect(
      windowContains([validWindow], 'America/Chicago', '2026-09-29T15:00:00.000Z', 25),
    ).toBe(true);
  });

  it('rejects a session that runs past the window end', () => {
    expect(
      windowContains([validWindow], 'America/Chicago', '2026-09-29T16:50:00.000Z', 25),
    ).toBe(false);
  });

  it('returns false when no windows are saved', () => {
    expect(windowContains([], 'America/Chicago', '2026-09-29T15:00:00.000Z', 25)).toBe(false);
  });
});

describe('MentorOfferSchema', () => {
  it('allows an offer with video only and no live service', () => {
    const parsed = MentorOfferSchema.safeParse({
      hourlyRateDollars: 200,
      services: [],
      videoRequest: { enabled: true, priceCents: 7500, slaDays: 7 },
      timezone: 'UTC',
      windows: [],
    });
    expect(parsed.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/expert-offer/schema.test.ts`
Expected: FAIL, cannot resolve `@/lib/expert-offer/schema`

- [ ] **Step 3: Write minimal implementation**

`schema.ts` rules:

- `hourlyRateDollars`: int 1–10000
- `services`: unique array of `OFFERED_SERVICE_IDS`, max 3
- `windows`: 0–14 items; `weekday` int 0–6 (Sunday = 0); `startMinute` and `endMinute` ints; `0 <= start < end <= 1440`; `end - start >= 60`
- `timezone`: string that `Intl.DateTimeFormat(undefined, { timeZone }).format()` accepts
- `videoRequest`: `{ enabled: false }` or `{ enabled: true, priceCents: int 2500–50000, slaDays: int 3–14 }`
- Application requires `services.length + (video enabled ? 1 : 0) >= 1`, `fullName` 2–80, `email` email max 120, `employer` 2–120, `expertise` 2–200, `bio` 10–2000, `windows.length >= 1`
- `MentorOfferSchema` is the same offer fields but `windows` may be empty (dashboard can clear hours back to grandfathered)
- `windowContains`: convert `scheduledAtIso` with `Intl.DateTimeFormat` `en-US` `timeZone`, `weekday: 'short'`, `hour: '2-digit'`, `minute: '2-digit'`, `hourCycle: 'h23'`. Map `Sun..Sat` to 0–6. Start minute = hour * 60 + minute. End minute = start + durationMinutes. Match a window with the same weekday where `startMinute <= start && end <= endMinute`. A session that crosses local midnight returns false.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/expert-offer/schema.test.ts`
Expected: PASS, 8 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/expert-offer/schema.ts src/lib/expert-offer/schema.test.ts
git commit -m "feat: validate expert offer price, services, and hours"
```

---

### Task 2: Migration

**Files:**
- Create: `supabase/migrations/20260924120000_expert_applications_and_hours.sql`

**Interfaces:**
- Consumes: `public.service_type`, `public.mentors`
- Produces: `public.expert_applications`, `public.mentor_availability_windows`, `public.mentors.offered_services`

- [ ] **Step 1: Add the migration**

```sql
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS offered_services public.service_type[] NOT NULL
    DEFAULT ARRAY['session_1on1']::public.service_type[];

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS timezone text;

COMMENT ON COLUMN public.mentors.offered_services IS
  'Buyer-facing live services. Video requests stay on video_requests_enabled.';

CREATE TABLE public.expert_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  employer text NOT NULL,
  expertise text NOT NULL,
  bio text NOT NULL,
  hourly_rate_cents integer NOT NULL CHECK (hourly_rate_cents BETWEEN 100 AND 1000000),
  services public.service_type[] NOT NULL DEFAULT '{}',
  video_requests_enabled boolean NOT NULL DEFAULT false,
  video_request_price_cents integer NOT NULL DEFAULT 0 CHECK (video_request_price_cents >= 0),
  video_request_sla_days integer NOT NULL DEFAULT 7 CHECK (video_request_sla_days BETWEEN 3 AND 14),
  timezone text NOT NULL,
  windows jsonb NOT NULL,
  is_civil_servant boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'declined')),
  mentor_id uuid REFERENCES public.mentors (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expert_applications_status_created_idx
  ON public.expert_applications (status, created_at DESC);

CREATE TABLE public.mentor_availability_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minute smallint NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute smallint NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  CHECK (end_minute - start_minute >= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mentor_availability_windows_mentor_idx
  ON public.mentor_availability_windows (mentor_id);

ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability_windows ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies. Service role only.
```

Do not add a client write policy. Apply this migration to the hosted project only when the user asks to ship the schema. Local tests mock Supabase.

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260924120000_expert_applications_and_hours.sql
git commit -m "feat: add expert applications and availability windows"
```

---

### Task 3: Public apply API

**Files:**
- Create: `src/lib/expert-offer/applications.ts`
- Create: `src/app/api/expert-applications/route.ts`
- Create: `src/app/api/expert-applications/route.test.ts`

**Interfaces:**
- Consumes: `ExpertApplicationSchema`
- Produces: `submitExpertApplication(input) → { id: string }`; `POST /api/expert-applications`

Request JSON is the schema input. Response `201` `{ success: true }`. Do not return the row id to the browser.

Fail closed:

| Case | Status | Body |
|------|--------|------|
| Invalid JSON or schema | 400 | `{ success: false, error: 'Check the highlighted fields.' }` |
| Same normalized email already `submitted` | 200 | `{ success: true }` (no duplicate row, no enumeration) |
| Insert error | 500 | `{ success: false, error: 'Could not submit. Try again.' }` |

Store `hourly_rate_cents = hourlyRateDollars * 100`, lowercase trimmed email. No session cookie. No mentor insert. No email send in this task.

Rate limit: in-memory map keyed by IP from `x-forwarded-for` first hop, max 5 posts per 10 minutes per process. Over limit returns 429 `{ success: false, error: 'Too many applications. Try again later.' }`. Document that this is per-instance, not global.

- [ ] **Step 1: Write route tests** that mock `submitExpertApplication` and assert: valid body calls it once and returns 201 without an id; hourly rate 0 returns 400 and does not call it; second submitted email short-circuit is covered in `applications.test.ts` by mocking supabase admin to return an existing submitted row and asserting insert is not called.

- [ ] **Step 2: Run tests, confirm fail, implement, confirm pass**

Run: `npx vitest run src/app/api/expert-applications/route.test.ts src/lib/expert-offer/applications.test.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/expert-offer/applications.ts src/lib/expert-offer/applications.test.ts src/app/api/expert-applications/route.ts src/app/api/expert-applications/route.test.ts
git commit -m "feat: accept public expert applications"
```

---

### Task 4: Admin review API

**Files:**
- Modify: `src/lib/expert-offer/applications.ts`
- Create: `src/app/api/admin/expert-applications/route.ts`
- Create: `src/app/api/admin/expert-applications/route.test.ts`
- Modify: `src/app/dashboard/admin/admin-dashboard-client.tsx` only enough to render a list and Approve button if a small panel component is cleaner: `src/app/dashboard/admin/expert-applications-panel.tsx`

**Interfaces:**
- Consumes: `requireApiRole('admin')`, `createOrUpdateMentor`
- Produces:
  - `GET /api/admin/expert-applications` → `{ success: true, applications: [{ id, fullName, email, employer, hourlyRateCents, services, status, createdAt }] }` limited to 50, newest first
  - `POST /api/admin/expert-applications` body `{ id: uuid, decision: 'approve' | 'decline' }`

Approve path:

1. Load the application. Missing → 404. Status not `submitted` → 409 `{ success: false, error: 'Already reviewed.' }`.
2. Call `createOrUpdateMentor` with email, full name, employer, expertise split on commas, bio, `liveSessionPriceCents`, `isListed: false`, compliance left to that helper's current default. Extend `createOrUpdateMentor` only if that is the smallest way to set `offered_services`; otherwise update the new mentor row immediately after create. Copy video columns, set `mentors.timezone` from the application, and insert `mentor_availability_windows` from `windows`. Grandfathered mentors keep `timezone` null.
3. Set application `status = 'approved'`, `mentor_id` to the mentor id.
4. Do not send email in this task. Response includes `{ success: true, mentorId }`.

Decline sets `status = 'declined'` and does not create a mentor.

Mentee and mentor sessions receive the same 401/403 `requireApiRole` already returns.

- [ ] **Tests:** unauthenticated POST is rejected; mentor role is rejected; decline does not call `createOrUpdateMentor`; approve calls it with `isListed: false` and the application's cents; second approve returns 409.

- [ ] **Commit**

```bash
git commit -m "feat: let admins approve expert applications into unlisted mentors"
```

---

### Task 5: Marketing page `/for-experts`

**Files:**
- Create: `src/app/for-experts/page.tsx`
- Create: `src/components/for-experts/apply-form.tsx`
- Create: `e2e/for-experts-apply.spec.ts`

**Copy (verbatim):**

- Title: `Become an AstroLink expert`
- Description: `Apply to offer live 1:1 sessions with operators and specialists. AstroLink reviews every application before an expert appears in the directory.`
- H1: `Teach what you have already done.`
- Sub: `Set your hourly rate, the hours you can take calls, and the services you offer. We review the application, then send a private invite to finish your profile.`
- Primary button: `Submit application`
- Success: `Application received. If we move forward, you will get an email to finish setup. AstroLink reviews every application before an expert appears in the directory.`

Layout: `LandingHeader`, one column, max width 40rem, form fields in the same order as `ExpertApplicationSchema`. Price input labeled `Hourly rate (USD)`. Helper under price: `Buyers see this rate. A shorter session is priced from the hour.` Services are checkboxes labeled `Live 1:1`, `Pre-call brief`, `Extended session`, `Personal video`. Hours: timezone select of `America/New_York`, `America/Chicago`, `America/Denver`, `America/Los_Angeles`, `UTC`, plus seven optional rows (one per weekday) with start and end `<input type="time">`. Empty rows are omitted. At least one row required before submit.

Page must be readable at 390px and 1280px. Primary button uses `--landing-ink` fill and white text. No second accent button.

- [ ] **E2E pass:** open `/for-experts`, fill valid fields, intercept `POST /api/expert-applications` to return `{ success: true }` with 201, see the success sentence.
- [ ] **E2E fail path:** submit with empty name, see a field error, and assert the request was not sent (`page.waitForRequest` times out / route not hit). Use the form's client-side check before fetch.

- [ ] **Commit**

```bash
git commit -m "feat: add the public expert application page"
```

---

### Task 6: Mentor offer API and wizard steps

**Files:**
- Create: `src/lib/expert-offer/offer.ts`
- Create: `src/app/api/mentor/offer/route.ts`
- Create: `src/app/api/mentor/offer/route.test.ts`
- Create: `src/components/activate/offer-steps.tsx`
- Modify: `src/components/activate/activate-shell.tsx` `STEP_LABELS` to `Welcome, Identity, Password, Profile, Services, Hours, Payouts, Done` (8 steps)
- Modify: `src/app/activate/setup/activate-setup-client.tsx` to insert the two steps after Profile and shift Payouts/Done
- Modify: `src/app/dashboard/mentor/mentor-settings-panel.tsx` to mount the same offer fields and save through the API

**Interfaces:**
- `GET /api/mentor/offer` requires an activated mentor. Returns `{ hourlyRateDollars, services, videoRequest, timezone, windows }`. Timezone falls back to `America/Chicago` when the column is null. Windows `[]` when none saved.
- `PATCH /api/mentor/offer` body is `MentorOfferSchema`. Replaces windows in a delete-then-insert for that mentor id only. Updates `live_session_price_cents`, `offered_services`, video columns, `timezone`. Does not change `is_listed` or `compliance_status`.

Another mentor's id is never accepted in the body. The session user id is the only key.

Activate steps:

- Services: checkboxes, at least one of live services or video. Copy: `Choose what buyers can book. You can change this later in settings.`
- Hours: same weekday rows as the public form. Copy: `Calls can be booked only inside these hours after you save them. Leave this blank only if ops is still scheduling you by hand.` Saving zero windows is allowed from this step (grandfather). The public application still requires one window.

Profile step keeps the existing rate field. Services step reads that rate and sends it again on PATCH so one save writes the whole offer. Hours step sends the same payload plus windows.

- [ ] **Tests:** mentee PATCH returns 401/403; valid PATCH writes cents `15000` for rate 150 and does not include `is_listed` in the update object; window replace deletes only `eq('mentor_id', session.userId)`.

- [ ] **Commit**

```bash
git commit -m "feat: save expert services and weekly hours from the wizard"
```

---

### Task 7: Enforce saved hours at booking

**Files:**
- Modify: `src/services/agents/booking-agent.ts`
- Modify: `src/services/agents/booking-agent.test.ts`
- Create: `src/lib/expert-offer/load-windows.ts` (`loadMentorWindows(mentorId) → { timezone: string | null, windows: Window[] }`)

**Rule:** If `windows.length === 0`, do not call `windowContains` (grandfather). If `windows.length > 0` and `windowContains` is false for `scheduledAt` and `durationMinutes`, throw the existing booking error type with message `That time is outside this expert's hours.` Status surfaced by `POST /api/book` must be 400, not 500. Cover that mapping if the route turns thrown errors into 500 today: catch this specific message in the route or return a typed result. Do not open a new error channel.

Chris campaign booking that already constrains dates must still pass when Chris has zero windows.

- [ ] **Tests:**
  - mentor with no windows, future slot, still books
  - mentor with Tuesday 09:00–12:00 Chicago, slot `2026-09-29T15:00:00.000Z`, 25 minutes, books
  - same mentor, slot `2026-09-29T16:50:00.000Z`, 25 minutes, rejects with `That time is outside this expert's hours.`
  - `session_1on1` when `offered_services` does not include it, rejects with `This expert does not offer that service.`
  - video-request path is unchanged in this task

- [ ] **Commit**

```bash
git commit -m "feat: reject bookings outside an expert's saved hours"
```

---

## API index

| Method | Path | Who | Pass | Fail |
|--------|------|-----|------|------|
| POST | `/api/expert-applications` | Public | 201 `{ success: true }` and one `submitted` row | 400 invalid body; 429 over 5/10min; 200 duplicate submitted email with no second row |
| GET | `/api/admin/expert-applications` | Admin | 200 list, no bio in the list payload | 401/403 other roles |
| POST | `/api/admin/expert-applications` | Admin | approve → unlisted mentor, application `approved`; decline → no mentor | 404 unknown id; 409 already reviewed; 401/403 |
| GET | `/api/mentor/offer` | Activated mentor | own price, services, windows | 401/403 |
| PATCH | `/api/mentor/offer` | Activated mentor | own row updated, `is_listed` unchanged | 400 bad offer; 401/403 |

## QA pass / fail

Run against a local app with `APP_MODE=full`. Unit gate is mandatory. Browser gate is mandatory for the pages below.

**Pass (all must hold):**

1. `npx vitest run src/lib/expert-offer src/app/api/expert-applications src/app/api/admin/expert-applications src/app/api/mentor/offer src/services/agents/booking-agent.test.ts` exits 0.
2. `/for-experts` at 390px and 1280px shows the H1, the review sentence, and a working submit that ends on the success sentence. No satellite icon.
3. Invalid hourly rate `0` does not show success.
4. A signed-out `GET /api/admin/expert-applications` is 401 or 403.
5. Admin approve of a fixture application creates a mentor with `is_listed = false`.
6. Activated mentor can save Tuesday 09:00–12:00 and reload the wizard to see that window.
7. Booking that mentor at a time outside the window shows `That time is outside this expert's hours.` and does not create a booking row.
8. An existing listed mentor with no windows can still be booked at a valid future time.

**Fail (any one fails the release):**

- Apply response includes a mentor id, session cookie, or `is_listed: true`.
- Public route accepts a PDF or writes to storage.
- Approve lists the expert.
- A buyer books outside saved windows.
- Wizard copy promises approval, income, or a listing date.
- Page introduces a font other than Montserrat or a dark aerospace backdrop.
- `npm test` suite for the files above fails.

## Design review

Scores are for this plan, not the shipped UI. A 10 means the built page matches `DESIGN.md` and a stranger can finish apply on a phone without reading help text twice.

| Dimension | Score | What makes it a 10 |
|-----------|-------|--------------------|
| Hierarchy | 8 | One H1, one submit, rate and hours before the bio. Bio is last because it is the long field. |
| Trust | 8 | The review sentence is on the page and again on success. No earnings claim. |
| Mobile | 7 | One column and time inputs per weekday. Build must not use a 7-column grid. Verify at 390px. |
| Consistency | 8 | Marketing uses landing tokens. Wizard uses activate styles, not the old `/onboard` material theme. |
| Services clarity | 7 | Four labels mapped to existing products. Video is separate from the live enum so buyers are not sold a service the API cannot fulfill. |
| Empty / error | 8 | Field errors from the API 400, success state with no second CTA, duplicate email looks like success. |

Design findings folded into the plan: public page is `/for-experts` beside `/for-educators`; wizard is two added activate steps, not a new visual system; `/onboard` is not restyled here.

## Engineering review

- **Data flow:** browser → Zod → service role insert. Admin approve is the only mentor insert. Booking reads windows server-side.
- **Edge cases:** duplicate email, double approve, zero windows, session crossing local midnight, video-only offer, Chris with no windows.
- **Performance:** windows are at most 14 rows per mentor, loaded once per booking. No slot-search endpoint in this plan (buyers still pick a time; the server accepts or rejects).
- **Out of scope:** self-serve accounts, Stripe Connect changes, auto-listing, email delivery, replacing `/onboard`, a calendar UI of open slots.

## Security review (CSO, scoped to this feature)

This is a design threat model of the new routes. It is not a full-repository `/cso` daily audit of AstroLink.

| Threat | Control in this plan |
|--------|----------------------|
| Stranger lists themselves | Public POST never writes `mentors` or `is_listed`. Approve forces `isListed: false`. |
| Stranger edits another expert's price | PATCH keys only off the session mentor id. |
| Application spam | 5 requests / 10 minutes / IP per instance, duplicate submitted email is a silent 200. |
| Unauthenticated file drop | No upload on the public route. NF-1860 stays authenticated. |
| Service smuggling | Zod enum only. Booking checks `offered_services`. |
| Cross-tenant window replace | Delete and insert filter `mentor_id = session.userId`. |
| PII in the admin list | List payload omits bio. Detail can be added later. |
| Enumeration | Duplicate apply returns the same `{ success: true }` as a new apply. |

Residual risk, accepted for v1: the rate limit is per server instance, and there is no email verification before the row is stored. Admin review is the gate that makes that acceptable.

## Decision ledger

| # | Finding | Disposition | Owner / next step |
|---|---------|-------------|-------------------|
| 1 | Self-serve signup would create listed experts | Rejected | Public apply + admin approve only |
| 2 | Two price policies ($50 floor vs dashboard $1–$10,000) | Rejected | Use dashboard bounds |
| 3 | Enforce hours for mentors who never saved windows | Rejected | Empty windows stay bookable |
| 4 | Rebuild `/onboard` | Deferred | Dead-end form stays until a later deletion plan |
| 5 | Slot picker that only shows open hours | Deferred | Server reject ships first |
| 6 | Applicant confirmation email | Deferred | Success copy only in v1 |
| 7 | Per-instance rate limit | Accepted | Task 3; revisit if apply volume grows |
| 8 | Video as a fourth live `service_type` | Rejected | Keep existing video columns |

**Session outcome:** revise plan is done; implementation waits for a go-ahead to run subagent-driven-development.

## Test ledger

| Planned check | Test file | Status |
|---------------|-----------|--------|
| Rate, services, overnight window, slot inside/outside | `src/lib/expert-offer/schema.test.ts` | add |
| Public POST 400 and 201 shape | `src/app/api/expert-applications/route.test.ts` | add |
| Duplicate submitted email does not insert | `src/lib/expert-offer/applications.test.ts` | add |
| Non-admin cannot approve; approve is unlisted; double approve 409 | `src/app/api/admin/expert-applications/route.test.ts` | add |
| Mentor PATCH cannot set `is_listed` | `src/app/api/mentor/offer/route.test.ts` | add |
| No windows still books; outside window rejects; missing service rejects | `src/services/agents/booking-agent.test.ts` | add |
| Public form success and blocked invalid submit | `e2e/for-experts-apply.spec.ts` | add |

## Simplification

| Action | Target | Why now |
|--------|--------|---------|
| Leave in place | `src/app/onboard/onboard-client.tsx` | It does not persist; replacing it in the same change mixes marketing with a broken compliance form |
| Reuse | `createOrUpdateMentor`, activate shell, `ProfileSchema` bounds | Avoids a second expert-create path and a second price rule |
| Do not add | New env flag, new service enum value, slot-search API | Smaller review surface |
| Split | Offer logic in `src/lib/expert-offer/` | Keeps `booking-agent.ts` from growing by a schema |

## Engineering discipline closeout

**Decisions:** 5 accepted or rejected in the ledger, 3 deferred, 0 need option
**Tests:** 7 test files named
**Simplification:** reuse create/activate; do not revive `/onboard` in this plan
**Next action:** implement Task 1 under subagent-driven-development when told to build

## GSTACK REVIEW REPORT

- Design review: folded in. Plan is implementable without a new visual language.
- Eng review: listing gate, grandfather rule, and booking enforcement are specified with tests.
- CSO: scoped threat model of the new routes. Not a 14-phase repository audit.
- Open product choice: none. Defaults above govern unless the founder overrides them before Task 1.
