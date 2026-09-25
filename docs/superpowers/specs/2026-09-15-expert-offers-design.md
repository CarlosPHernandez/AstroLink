# Design: Expert Offers (beta SKU layer)

**Date:** 2026-09-15  
**Source PRD:** `/Users/carloshernandez/Downloads/AstroLink_Expert_Offers_PRD_2026-09-15.md`  
**Status:** Accepted — implementation plan `docs/superpowers/plans/2026-09-15-expert-offers.md`  
**Code names:** Feature = Expert Offers. Dashboard tab / public noun = **Services**. Table prefix = `expert_offers`.

## Problem

Experts sell one generic thing: talk for N minutes at an hourly rate. That is hard to share. A buyer who already follows the expert wants a named session with a frozen price and duration, not a directory profile and a slider.

There is no proven demand. This is a supply-side beta: one allowlisted mentor gets a shareable URL; we measure whether anyone books.

## Job to be done

- **Expert:** Package one conversation, freeze price and length, share one URL.
- **Buyer:** Open the link, understand the session on one screen, pick a time, pay, show up.
- **AstroLink:** Fulfill with the existing live-session stack. Do not split payouts, rooms, or calendars.

## Approach

**SKU layer on existing machines** (Approach 1):

- New `expert_offers` rows lock duration + price onto the existing `/api/book` → Stripe → Daily → notification path.
- Mentor **Services** tab on the current dashboard (not nested routes).
- Public URL `/s/{mentorSlug}/{offerSlug}`.
- Checkout `/booking?mentor={slug}&offer={offerSlug}` reuses `BookingClient`: hide slider, lock SKU, keep datetime picker + goals + background.

Not chosen: nested `/dashboard/mentor/offers` app (breaks the tab dashboard); ops-only SQL inserts (experts cannot iterate copy).

## Locked decisions

| Decision | Choice |
|---|---|
| Availability | Reuse existing datetime picker + 2-day Eastern lead. No weekly hours. No Google Calendar. |
| Duration allowlist | `15 \| 30 \| 45 \| 60` only. No 90. |
| Prep files | Skip in beta. No `expert_offer_assets`, no bucket, no signed URLs. Description is the prep field. |
| Chris campaign | Offer checkout uses the generic locked-SKU booking page. `/talk-with-chris` and the campaign wizard stay untouched. `campaign` + `offerSlug` are mutually exclusive. |
| Dashboard | **Services** sidebar tab (flag-on only). List of the mentor’s offers, published first. |
| Profile / homepage | Share-URL only. No chips on `/experts`, homepage, Variation B, or `/experts/[slug]`. |
| Unlisted mentors | Cannot publish. `is_listed` required. |
| Archived / unpublished public URL | 404. |
| Launch flag | `mentors.expert_offers_enabled` default `false`. Set `true` only for `cpachecohernande631@access.alamancecc.edu`. Not Eiman, Chris, or David. |
| Comp grants | Rejected on offer bookings. |
| Buyer prompt columns | Skip. Reuse existing goals + background. |
| Stored `public_path` | Skip. API computes `/s/{mentorSlug}/{offerSlug}`. |

## Explicit non-goals

- Homepage, directory cards, or Variation B mentioning services or packages
- Global `/services` marketplace
- Group calls, cohorts, courses, subscriptions, retainers
- Async deliverables (`video_requests` stays separate)
- Buyer file uploads
- Expert prep-file uploads
- Guarantees, coupons, sliding scale, free offers (`price_cents = 0` blocked)
- Changing price/duration after confirmed/completed bookings (create a new offer)
- Auto-posting to LinkedIn
- Weekly availability calendar or Google Calendar busy-time checks
- Admin offers API or admin preview of drafts
- New `service_type` values per product (only `packaged_offer`)
- A second Stripe / Daily / notification stack

---

## §1 Architecture and data model

```
Mentor Services tab  →  /api/mentor/offers  →  expert_offers
Public /s/{slug}/{offer}  →  server load of published offer
Book this session  →  /booking?mentor=&offer=
                         ↓
                   POST /api/book  (offerSlug)
                         ↓
         bookings (packaged_offer + snapshot) + existing Stripe / Daily / email
```

Reuse: `src/app/api/book`, `src/lib/booking-pricing.ts`, `src/lib/book-request-schema.ts`, Stripe PaymentIntent + Connect, Daily room + tokens, notification deliveries, mentor/mentee booking lists.

New code only for: offer CRUD, Services tab, public offer page, booking SKU lock-in, offer counters.

### Schema

Migration: `supabase/migrations/20260915120000_expert_offers.sql`.

```sql
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'packaged_offer';

CREATE TYPE public.expert_offer_status AS ENUM (
  'draft',
  'published',
  'unpublished',
  'archived'
);

CREATE TABLE public.expert_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 8 AND 80),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text NOT NULL CHECK (char_length(description) BETWEEN 40 AND 1200),
  duration_minutes integer NOT NULL CHECK (duration_minutes IN (15, 30, 45, 60)),
  price_cents integer NOT NULL CHECK (price_cents >= 1000 AND price_cents <= 50000),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  status public.expert_offer_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  unpublished_at timestamptz,
  archived_at timestamptz,
  page_views integer NOT NULL DEFAULT 0,
  checkout_starts integer NOT NULL DEFAULT 0,
  bookings_paid integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, slug)
);

CREATE INDEX expert_offers_mentor_status_idx
  ON public.expert_offers (mentor_id, status);

CREATE INDEX expert_offers_published_idx
  ON public.expert_offers (status, published_at DESC)
  WHERE status = 'published';

ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS expert_offers_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS expert_offer_id uuid
    REFERENCES public.expert_offers (id) ON DELETE RESTRICT;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS offer_snapshot jsonb;

CREATE INDEX bookings_expert_offer_id_idx
  ON public.bookings (expert_offer_id)
  WHERE expert_offer_id IS NOT NULL;

UPDATE public.mentors
SET expert_offers_enabled = true
WHERE lower(email) = 'cpachecohernande631@access.alamancecc.edu';
```

Slug uniqueness is per mentor, not global.

`offer_snapshot` at checkout:

```json
{
  "offer_id": "...",
  "title": "Book lessons and how to apply them",
  "slug": "book-lessons-and-how-to-apply-them",
  "duration_minutes": 45,
  "price_cents": 1000
}
```

### Invariants (API, not a DB check constraint in beta)

- If `expert_offer_id` is set, `service_type` must be `packaged_offer`.
- Booking `duration_minutes` and charged cents come from the offer, not the client and not `mentors.live_session_price_cents`.
- Snapshot is written at checkout so later title edits do not rewrite history.
- Comp grants rejected when `offerSlug` is present.
- Chris `campaign` and `offerSlug` are mutually exclusive.

### RLS

Match video-requests: public read is narrow; writes go through Next.js + `supabaseAdmin`.

- `anon` / `authenticated` SELECT on `expert_offers` where `status = 'published'` and the mentor is `approved`, `is_listed`, and `expert_offers_enabled`.
- No client INSERT / UPDATE / DELETE.
- Counter increments and mentor writes use service role.

If the allowlist email is missing in an environment, the `UPDATE` is a no-op. Ops can set the column later. Do not hardcode that email in application TypeScript.

### Types

Extend `src/lib/types.ts`:

- `ServiceType` += `'packaged_offer'`
- `SERVICE_TYPE_LABELS.packaged_offer = 'Packaged session'` (fallback only; UI prefers `offer_snapshot.title`)
- `Mentor.expert_offers_enabled?: boolean`
- `Booking.expert_offer_id?: string | null`
- `Booking.offer_snapshot?: OfferSnapshot | null`

Regenerate / hand-update `src/lib/database.types.ts` to match the migration.

---

## §2 APIs and booking lock-in

Mentor-write routes require the existing mentor session (`/api/mentor/*`). Resolve mentor id the same way as video requests: `mentors.user_id = session.userId`, else `mentors.email = session.email`.

### Mentor CRUD

| Method | Path | Job |
|---|---|---|
| GET | `/api/mentor/offers` | List own offers + counters + computed `public_url` |
| POST | `/api/mentor/offers` | Create **draft**; server generates slug from title |
| GET | `/api/mentor/offers/[offerId]` | Detail |
| PATCH | `/api/mentor/offers/[offerId]` | Edit allowed fields |
| POST | `.../publish` | `draft` / `unpublished` → `published` |
| POST | `.../unpublish` | `published` → `unpublished` |
| POST | `.../archive` | any → `archived`; blocked if an upcoming confirmed booking exists |

No asset routes. No admin offers API.

**Slug:** lowercase, non-alphanumerics → hyphens, collapse/trim hyphens. Empty result → `offer`. Collision suffix `-2`, `-3`. Regenerated on title change only while status has never been `published`. After first publish, slug is frozen forever (including after unpublish).

**Create body:** `{ title, description, duration_minutes, price_cents }`. Response includes `public_url`.

**Edit rules**

- Draft / unpublished, never published: title, description, duration, price. Slug may follow title.
- After first publish: slug frozen. Title and description editable while not archived.
- Price and duration frozen once any booking on that offer has status `confirmed` or `completed`. Otherwise create a new offer.
- Archived is terminal (no unarchive in beta).

**Publish timestamps:** first publish sets `published_at` if null. Unpublish sets `unpublished_at`. Republish clears `unpublished_at` and does not change `published_at`. Slug freeze is `published_at IS NOT NULL`.

**Publish guards** (all required)

- `expert_offers_enabled = true`
- `stripe_onboarding_completed`
- `compliance_status = approved`
- `is_listed`
- title / description / duration / price valid
- fewer than 5 rows with `status = published` for that mentor

**Archive guard:** block if a booking with `expert_offer_id` = this offer, `status = confirmed`, and `scheduled_at` still upcoming (`isBookingUpcoming`).

**Unpublish:** public URL 404s. Existing confirmed bookings are unchanged.

### Public

`/s/[mentorSlug]/[offerSlug]` is a server component. It loads the offer + public mentor card fields. **404** via `notFound()` if unpublished, archived, flag off, or mentor not `approved` + `listed`.

`POST /api/offers/public/[mentorSlug]/[offerSlug]/view` increments `page_views` (lossy, unauthenticated, no dedupe required). Do not add a cacheable public JSON GET; the page loads server-side.

Mentors preview drafts from the Services tab, not the public URL.

### Booking

CTA: `/booking?mentor={slug}&offer={offerSlug}`.

Booking page (`src/app/booking/page.tsx`) loads the published offer on the server. If `offer` is present and the offer is not bookable → `notFound()` (do not fall back to generic 1:1). If both `offer` and `campaign=chris` are in the query, **`offer` wins**: do not mount `ChrisBookingWizard`. The client must not send `campaign` when `offerSlug` is set. The API still 400s if both arrive in the body.

`POST /api/book` gains optional `offerSlug`. When present:

1. Require `mentorId` (existing client already sends it).
2. `serviceType` may be omitted; server sets `packaged_offer`. If the client sends `serviceType`, it must be `packaged_offer`.
3. Load published offer for that mentor (`status = published`, flag on, mentor approved + listed).
4. Ignore client `durationMinutes` and any client price.
5. Reject if `campaign` is the Chris campaign, or `applyCompGrantId` is set.
6. Charge `offer.price_cents` via existing PaymentIntent + Connect (`metadata.app = 'astrolink'`).
7. Insert booking: `service_type = packaged_offer`, `duration_minutes = offer.duration_minutes`, `expert_offer_id`, `offer_snapshot`.
8. Increment `checkout_starts` when `bookSession` successfully creates that booking (covers skip-payments too).
9. Increment `bookings_paid` only on the **first** transition to `confirmed` (`confirmBookingWithoutPayment` / `fulfillBookingAfterPayment` when `alreadyProcessed` is false and `expert_offer_id` is set).

`computeBookingTotalCents`: add optional `offerPriceCents`. If set, return that value and skip hourly proration.

`BriefingAgent.prepareBriefing`: treat `packaged_offer` like `session_1on1` (dual briefing). Do not throw.

Confirmation email, mentee rows, and mentor rows: display `offer_snapshot.title` when present; else `formatServiceTypeLabel`.

---

## §3 UI surfaces

Follow `DESIGN.md`: light marketplace, Montserrat, hairline borders, faces and trust. No new visual system. Public copy never says “marketplace,” “packages,” or “services directory.”

### Mentor dashboard — Services tab

- Add `'offers'` to `MentorDashboardTab` and a **Services** item in `PRIMARY_NAV` (after Sessions, before Videos).
- Render the tab only when `mentorProfile.expertOffersEnabled === true`. Hide it for everyone else. Do not show a coming-soon stub.
- `src/app/dashboard/mentor/page.tsx` must select `expert_offers_enabled`.
- New panel `mentor-offers-panel.tsx` (same fetch-on-tab pattern as video requests).

**List:** all of the mentor’s offers, published first, then draft / unpublished / archived. Columns/rows: title, status, price, duration, public URL + copy button, page views, paid bookings. Actions: edit, publish, unpublish, archive (when allowed).

**Empty state:** “Package one conversation you already run. Share the link. This is beta — it will not appear on the homepage.”

**Create / edit:** plain title, description, duration `<select>` of 15/30/45/60, price as dollars (whole dollars or two-decimal; convert to integer cents on save). No rich text, no file upload, no weekly hours. Publish CTA previews the public URL.

### Public page — `/s/[mentorSlug]/[offerSlug]`

One screen. No other experts. No duration slider.

1. Expert face, name, title (existing proof-line rules).
2. Offer title, frozen duration, frozen price.
3. Description.
4. What you get: live video · N minutes.
5. Primary CTA: **Book this session** → `/booking?mentor=&offer=`
6. Secondary: **View full profile** → `/experts/{slug}`

On mount, fire the lossy view POST.

### Booking page

When `offer` query is present:

- Mentor locked (no expert picker).
- `showDurationSlider={false}` (prop already exists).
- Summary shows offer title + duration + **offer price**, not `$X/hr`.
- Datetime picker, goals, background unchanged.
- Submit sends `offerSlug`; does not send a duration the server will trust.

### After booking

Mentee dashboard, mentor consultation cards, booking-confirmed email: `offer_snapshot.title` + duration. Join, briefing sidebar, recap, Daily room: unchanged.

### Surfaces that must not change

- Homepage / Variation B
- `/experts` directory cards
- `/experts/[slug]` (no packaged-sessions block)
- `/talk-with-chris` and Chris booking wizard

---

## §4 Errors, analytics, tests, rollout

### Errors

| Case | Behavior |
|---|---|
| Public URL unpublished / archived / flag off / unlisted / unapproved | 404 |
| Publish missing Stripe / not approved / not listed / invalid fields / 5 published | 400 with field-level reason |
| Archive while upcoming confirmed booking exists | 409 |
| `/booking?offer=` unknown or not bookable | 404, no generic 1:1 fallback |
| `/api/book` with `offerSlug` + Chris campaign | 400 |
| `/api/book` with `offerSlug` + comp grant | 400 |
| Client duration/price disagrees with offer | Ignore duration/price; still book at offer SKU (do not 400 solely for extra duration field) |
| Stripe failure | Existing booking payment-failed path; do not increment `bookings_paid` |

### Analytics

Four numbers per offer. Weekly question: did the shared URL convert? If this allowlisted mentor publishes and zero checkouts in 30 days, do not build a marketplace.

| Metric | Where | When |
|---|---|---|
| Page views | `expert_offers.page_views` | lossy public view POST |
| Checkout starts | `expert_offers.checkout_starts` | successful offer `bookSession` |
| Paid bookings | `expert_offers.bookings_paid` | first confirm only |
| Referrer | existing `bookings.marketing_referrer` | unchanged |

### Tests

- Unit: pricing — offer price wins; hourly proration unused when offer present.
- Unit: `BookBodySchema` — `offerSlug` optional; Chris campaign + offerSlug invalid; comp grant + offerSlug invalid.
- API: publish guards, 5-offer cap, slug immutability after first publish, public 404.
- API: `/api/book` writes snapshot, `packaged_offer`, charged cents = offer price.
- Briefing: `packaged_offer` uses dual 1:1 briefing (does not throw).
- E2E (flag on a **test** mentor, `SKIP_STRIPE_PAYMENTS=true`): create + publish → public page → locked booking → confirmed row shows offer title. Homepage and `/experts` do not mention Services. Do not use the production allowlist email as an E2E fixture.

### Rollout

1. Migration + types + RLS.
2. Mentor CRUD API.
3. Services tab (list / create / publish).
4. Public page + view counter.
5. Booking lock-in (`/api/book` + pricing + snapshot + labels).

Flag default false. Migration sets true only for `cpachecohernande631@access.alamancecc.edu` when that mentor row exists. Application code reads the column; it does not contain that email.

### Suggested files (implementation plan will pin exact edits)

- Create: `supabase/migrations/20260915120000_expert_offers.sql`
- Create: `src/lib/expert-offers/` (slug, public URL, status guards)
- Create: `src/app/api/mentor/offers/` and `[offerId]/` publish/unpublish/archive
- Create: `src/app/api/offers/public/[mentorSlug]/[offerSlug]/view/route.ts`
- Create: `src/app/s/[mentorSlug]/[offerSlug]/page.tsx`
- Create: `src/app/dashboard/mentor/mentor-offers-panel.tsx`
- Modify: `src/lib/types.ts`, `src/lib/database.types.ts`, `src/lib/booking-pricing.ts`, `src/lib/book-request-schema.ts`
- Modify: `src/app/api/book/route.ts`, `src/services/agents/booking-agent.ts`, `src/services/agents/briefing-agent.ts`
- Modify: `src/lib/post-payment.ts` (paid counter, idempotent)
- Modify: `src/app/booking/page.tsx`, `src/app/booking/booking-client.tsx`
- Modify: mentor nav + dashboard client + dashboard page
- Modify: mentee/mentor booking views + confirmation email to prefer `offer_snapshot.title`

---

## Simplification

- One table, one enum value, one dashboard tab, one public route, one extra book field.
- No materials, no calendar product, no marketplace, no Chris-wizard fork.
- Demand test is four counters on one allowlisted mentor.
