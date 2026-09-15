# Expert Offers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a flag-on mentor package a named live 1:1 (title, description, frozen duration and price), share `/s/{mentorSlug}/{offerSlug}`, and fulfill it through existing `/api/book` → Stripe → Daily → email.

**Architecture:** SKU layer on the current booking machine. New `expert_offers` rows lock duration and price; `POST /api/book` accepts `offerSlug` and writes `service_type = packaged_offer` plus `offer_snapshot`. Mentor **Services** tab on the existing dashboard. No second checkout, no materials, no weekly hours, no homepage/directory chips.

**Tech Stack:** Next.js App Router, Zod, Vitest, Playwright, hosted Supabase (service-role writes), existing Stripe PaymentIntent + Connect.

**Spec:** `docs/superpowers/specs/2026-09-15-expert-offers-design.md`

## Global Constraints

- Duration allowlist **15 | 30 | 45 | 60** only. No 90.
- Price **1000–50000** cents USD. No $0.
- Max **5** published offers per mentor.
- Title 8–80 chars. Description 40–1200 chars.
- Dashboard tab label **Services**. Table prefix `expert_offers`. Public noun is the offer title, not a marketplace.
- Flag `mentors.expert_offers_enabled` default **false**. Migration sets **true** only for `cpachecohernande631@access.alamancecc.edu`. Do **not** put that email in application TypeScript.
- No `expert_offer_assets`, no storage bucket, no weekly hours, no Google Calendar, no buyer_prompt columns, no stored `public_path`.
- Homepage, `/experts`, `/experts/[slug]`, `/talk-with-chris`, and the Chris wizard stay untouched. If both `offer` and `campaign=chris` are in the query, **offer wins**.
- Comp grants rejected on offer bookings.
- Prefer TDD: failing test → implement → pass → commit per task.
- Run unit tests with `npm test -- <path>` (Vitest). E2E with `npm run test:e2e -- e2e/expert-offers.spec.ts` only when port 3000 is free or Playwright starts its own server.
- Follow `DESIGN.md` (light marketplace, Montserrat, hairline borders). Public copy never says “marketplace,” “packages,” or “services directory.”

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/expert-offers/constants.ts` | Duration/price/title/description/cap constants |
| `src/lib/expert-offers/slug.ts` | Title → slug + collision suffix |
| `src/lib/expert-offers/path.ts` | `/s/{mentorSlug}/{offerSlug}` |
| `src/lib/expert-offers/money.ts` | Dollars → cents |
| `src/lib/expert-offers/types.ts` | `OfferSnapshot`, status union, list DTO |
| `src/lib/expert-offers/label.ts` | Prefer snapshot title over `formatServiceTypeLabel` |
| `src/lib/expert-offers/guards.ts` | Publish / edit / archive rules |
| `src/lib/expert-offers/resolve-mentor.ts` | Session → mentor row (video-requests pattern) |
| `src/lib/expert-offers/load-public-offer.ts` | Bookable published offer loader |
| `src/lib/expert-offers/counters.ts` | Lossy counter increment |
| `supabase/migrations/20260915120000_expert_offers.sql` | Enum, table, flag, booking FKs, RLS, allowlist UPDATE |
| `src/lib/types.ts` | `packaged_offer` on `ServiceType` + mentor/booking fields |
| `src/lib/database.types.ts` | Generated-shape update for new enum/table/columns |
| `src/lib/booking-pricing.ts` | Optional `offerPriceCents` short-circuit |
| `src/lib/book-request-schema.ts` | Optional `offerSlug` + mutual exclusions |
| `src/app/api/mentor/offers/route.ts` | GET list, POST create |
| `src/app/api/mentor/offers/[offerId]/route.ts` | GET detail, PATCH |
| `src/app/api/mentor/offers/[offerId]/publish/route.ts` | POST publish |
| `src/app/api/mentor/offers/[offerId]/unpublish/route.ts` | POST unpublish |
| `src/app/api/mentor/offers/[offerId]/archive/route.ts` | POST archive |
| `src/app/api/offers/public/[mentorSlug]/[offerSlug]/view/route.ts` | POST page_views |
| `src/app/s/[mentorSlug]/[offerSlug]/page.tsx` | Public offer page |
| `src/app/dashboard/mentor/mentor-offers-panel.tsx` | Services tab UI |
| `src/app/dashboard/mentor/mentor-dashboard-nav.tsx` | Services nav item |
| `src/app/dashboard/mentor/mentor-dashboard-client.tsx` | Tab render when flag on |
| `src/app/dashboard/mentor/page.tsx` | Select `expert_offers_enabled` |
| `src/app/api/book/route.ts` | Pass `offerSlug`; set `packaged_offer` |
| `src/services/agents/booking-agent.ts` | Load offer, lock price/duration, snapshot, checkout_starts |
| `src/lib/post-payment.ts` | Idempotent `bookings_paid` |
| `src/services/agents/briefing-agent.ts` | Treat `packaged_offer` as 1:1 |
| `src/lib/mentee-bookings.ts` / `src/lib/mentor-bookings.ts` | Select `offer_snapshot` |
| `src/lib/email/booking-confirmed-templates.ts` | Snapshot title |
| `src/app/booking/page.tsx` / `booking-client.tsx` | Locked SKU checkout |
| `e2e/expert-offers.spec.ts` | Flag-on create → public → book |

---

### Task 1: Domain helpers (slug, path, money, constants)

**Files:**
- Create: `src/lib/expert-offers/constants.ts`
- Create: `src/lib/expert-offers/slug.ts`
- Create: `src/lib/expert-offers/slug.test.ts`
- Create: `src/lib/expert-offers/path.ts`
- Create: `src/lib/expert-offers/path.test.ts`
- Create: `src/lib/expert-offers/money.ts`
- Create: `src/lib/expert-offers/money.test.ts`
- Create: `src/lib/expert-offers/types.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `OFFER_DURATIONS = [15, 30, 45, 60] as const`
  - `OfferDurationMinutes = (typeof OFFER_DURATIONS)[number]`
  - `OFFER_PRICE_MIN_CENTS = 1000`, `OFFER_PRICE_MAX_CENTS = 50000`
  - `OFFER_TITLE_MIN = 8`, `OFFER_TITLE_MAX = 80`
  - `OFFER_DESCRIPTION_MIN = 40`, `OFFER_DESCRIPTION_MAX = 1200`
  - `OFFER_PUBLISHED_CAP = 5`
  - `OFFER_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/`
  - `slugifyOfferTitle(title: string): string`
  - `nextOfferSlug(base: string, existing: string[]): string`
  - `offerPublicPath(mentorSlug: string, offerSlug: string): string`
  - `dollarsToPriceCents(input: string | number): number | null`
  - `type ExpertOfferStatus = 'draft' | 'published' | 'unpublished' | 'archived'`
  - `type OfferSnapshot = { offer_id: string; title: string; slug: string; duration_minutes: number; price_cents: number }`

- [ ] **Step 1: Write failing tests**

Create `src/lib/expert-offers/slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { nextOfferSlug, slugifyOfferTitle } from '@/lib/expert-offers/slug';

describe('slugifyOfferTitle', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyOfferTitle('Book Lessons and How to Apply Them')).toBe(
      'book-lessons-and-how-to-apply-them',
    );
  });

  it('collapses punctuation and spaces', () => {
    expect(slugifyOfferTitle('Thesis / dissertation review')).toBe(
      'thesis-dissertation-review',
    );
  });

  it('falls back to offer when empty', () => {
    expect(slugifyOfferTitle('!!!')).toBe('offer');
  });
});

describe('nextOfferSlug', () => {
  it('returns the base when free', () => {
    expect(nextOfferSlug('strategy-call', [])).toBe('strategy-call');
  });

  it('suffixes -2 then -3 on collision', () => {
    expect(nextOfferSlug('strategy-call', ['strategy-call'])).toBe('strategy-call-2');
    expect(nextOfferSlug('strategy-call', ['strategy-call', 'strategy-call-2'])).toBe(
      'strategy-call-3',
    );
  });
});
```

Create `src/lib/expert-offers/path.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { offerPublicPath } from '@/lib/expert-offers/path';

describe('offerPublicPath', () => {
  it('builds the canonical share path', () => {
    expect(offerPublicPath('eiman-jahangir', 'book-lessons-and-how-to-apply-them')).toBe(
      '/s/eiman-jahangir/book-lessons-and-how-to-apply-them',
    );
  });
});
```

Create `src/lib/expert-offers/money.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { dollarsToPriceCents } from '@/lib/expert-offers/money';
import { OFFER_PRICE_MAX_CENTS, OFFER_PRICE_MIN_CENTS } from '@/lib/expert-offers/constants';

describe('dollarsToPriceCents', () => {
  it('converts whole dollars and two-decimal dollars', () => {
    expect(dollarsToPriceCents(10)).toBe(1000);
    expect(dollarsToPriceCents('10')).toBe(1000);
    expect(dollarsToPriceCents('12.50')).toBe(1250);
  });

  it('rejects below $10 and above $500', () => {
    expect(dollarsToPriceCents(9.99)).toBeNull();
    expect(dollarsToPriceCents(500.01)).toBeNull();
    expect(dollarsToPriceCents(OFFER_PRICE_MIN_CENTS / 100)).toBe(OFFER_PRICE_MIN_CENTS);
    expect(dollarsToPriceCents(OFFER_PRICE_MAX_CENTS / 100)).toBe(OFFER_PRICE_MAX_CENTS);
  });

  it('rejects non-numeric input', () => {
    expect(dollarsToPriceCents('nope')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/expert-offers/slug.test.ts src/lib/expert-offers/path.test.ts src/lib/expert-offers/money.test.ts`

Expected: FAIL with cannot find module / function not defined.

- [ ] **Step 3: Implement**

Create `src/lib/expert-offers/constants.ts`:

```ts
export const OFFER_DURATIONS = [15, 30, 45, 60] as const;
export type OfferDurationMinutes = (typeof OFFER_DURATIONS)[number];

export const OFFER_PRICE_MIN_CENTS = 1000;
export const OFFER_PRICE_MAX_CENTS = 50000;
export const OFFER_TITLE_MIN = 8;
export const OFFER_TITLE_MAX = 80;
export const OFFER_DESCRIPTION_MIN = 40;
export const OFFER_DESCRIPTION_MAX = 1200;
export const OFFER_PUBLISHED_CAP = 5;
export const OFFER_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isOfferDuration(value: number): value is OfferDurationMinutes {
  return (OFFER_DURATIONS as readonly number[]).includes(value);
}
```

Create `src/lib/expert-offers/slug.ts`:

```ts
import { OFFER_SLUG_RE } from '@/lib/expert-offers/constants';

export function slugifyOfferTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return OFFER_SLUG_RE.test(slug) ? slug : 'offer';
}

export function nextOfferSlug(base: string, existing: string[]): string {
  const taken = new Set(existing);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
```

Create `src/lib/expert-offers/path.ts`:

```ts
export function offerPublicPath(mentorSlug: string, offerSlug: string): string {
  return `/s/${mentorSlug}/${offerSlug}`;
}
```

Create `src/lib/expert-offers/money.ts`:

```ts
import { OFFER_PRICE_MAX_CENTS, OFFER_PRICE_MIN_CENTS } from '@/lib/expert-offers/constants';

export function dollarsToPriceCents(input: string | number): number | null {
  const n = typeof input === 'number' ? input : Number.parseFloat(input.trim());
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (cents < OFFER_PRICE_MIN_CENTS || cents > OFFER_PRICE_MAX_CENTS) return null;
  return cents;
}
```

Create `src/lib/expert-offers/types.ts`:

```ts
import type { OfferDurationMinutes } from '@/lib/expert-offers/constants';

export type ExpertOfferStatus = 'draft' | 'published' | 'unpublished' | 'archived';

export type OfferSnapshot = {
  offer_id: string;
  title: string;
  slug: string;
  duration_minutes: OfferDurationMinutes | number;
  price_cents: number;
};

export type ExpertOfferListItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  status: ExpertOfferStatus;
  published_at: string | null;
  public_url: string;
  page_views: number;
  checkout_starts: number;
  bookings_paid: number;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/expert-offers/slug.test.ts src/lib/expert-offers/path.test.ts src/lib/expert-offers/money.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/expert-offers/
git commit -m "feat(offers): add slug, path, and price helpers"
```

---

### Task 2: Types + offer price branch

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/booking-pricing.ts`
- Modify: `src/lib/booking-pricing.test.ts`
- Create: `src/lib/expert-offers/label.ts`
- Create: `src/lib/expert-offers/label.test.ts`

**Interfaces:**
- Consumes: `OfferSnapshot` from Task 1
- Produces:
  - `ServiceType` includes `'packaged_offer'`
  - `SERVICE_TYPE_LABELS.packaged_offer = 'Packaged session'`
  - `Mentor.expert_offers_enabled?: boolean`
  - `Booking.expert_offer_id?: string | null`
  - `Booking.offer_snapshot?: OfferSnapshot | null`
  - `computeBookingTotalCents({ offerPriceCents?: number })` returns `offerPriceCents` when set
  - `formatOfferBookingLabel({ serviceType, durationMinutes, offerTitle })`

- [ ] **Step 1: Write failing pricing + label tests**

Append to `src/lib/booking-pricing.test.ts`:

```ts
  it('charges the frozen offer price and skips hourly proration', () => {
    expect(
      computeBookingTotalCents({
        serviceType: 'packaged_offer',
        liveSessionPriceCents: 32_000,
        includePreCallBrief: false,
        durationMinutes: 45,
        offerPriceCents: 1000,
      }),
    ).toBe(1000);
  });
```

Create `src/lib/expert-offers/label.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatOfferBookingLabel } from '@/lib/expert-offers/label';

describe('formatOfferBookingLabel', () => {
  it('prefers the snapshot title', () => {
    expect(
      formatOfferBookingLabel({
        serviceType: 'packaged_offer',
        durationMinutes: 45,
        offerTitle: 'Book lessons and how to apply them',
      }),
    ).toBe('Book lessons and how to apply them (45 min)');
  });

  it('falls back to Packaged session', () => {
    expect(
      formatOfferBookingLabel({
        serviceType: 'packaged_offer',
        durationMinutes: 30,
      }),
    ).toBe('Packaged session (30 min)');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/booking-pricing.test.ts src/lib/expert-offers/label.test.ts`

Expected: FAIL (unknown serviceType / missing offerPriceCents / module not found).

- [ ] **Step 3: Implement**

In `src/lib/types.ts` change:

```ts
export type ServiceType = 'session_1on1' | 'pre_call_brief' | 'extended_session' | 'packaged_offer';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  session_1on1: 'Expert session',
  pre_call_brief: 'Pre-call brief package',
  extended_session: 'Deep-dive expert session',
  packaged_offer: 'Packaged session',
};
```

On `Mentor` add:

```ts
  expert_offers_enabled?: boolean;
```

On `Booking` add:

```ts
  expert_offer_id?: string | null;
  offer_snapshot?: import('@/lib/expert-offers/types').OfferSnapshot | null;
```

In `src/lib/booking-pricing.ts` update `computeBookingTotalCents`:

```ts
export function computeBookingTotalCents(params: {
  serviceType: ServiceType;
  liveSessionPriceCents: number;
  includePreCallBrief: boolean;
  durationMinutes?: number;
  offerPriceCents?: number;
}): number {
  if (params.offerPriceCents != null) {
    return params.offerPriceCents;
  }

  if (params.serviceType === 'extended_session') {
    throw new Error('extended_session is not available in D1');
  }

  if (params.serviceType === 'pre_call_brief') {
    return PRE_CALL_BRIEF_ADDON_CENTS;
  }

  if (params.durationMinutes != null) {
    return computeDurationPriceCents(params.liveSessionPriceCents, params.durationMinutes);
  }

  return params.liveSessionPriceCents;
}
```

Create `src/lib/expert-offers/label.ts`:

```ts
import { formatServiceTypeLabel } from '@/lib/types';

export function formatOfferBookingLabel(opts: {
  serviceType: string;
  durationMinutes?: number | null;
  offerTitle?: string | null;
}): string {
  const title = opts.offerTitle?.trim();
  if (title) {
    if (opts.durationMinutes != null && Number.isFinite(opts.durationMinutes) && opts.durationMinutes > 0) {
      return `${title} (${Math.floor(opts.durationMinutes)} min)`;
    }
    return title;
  }
  return formatServiceTypeLabel(opts.serviceType, opts.durationMinutes);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/booking-pricing.test.ts src/lib/expert-offers/label.test.ts src/lib/booking-export.test.ts src/lib/email/booking-confirmed-templates.test.ts`

Expected: PASS (export/email still use `formatServiceTypeLabel` fallback).

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/booking-pricing.ts src/lib/booking-pricing.test.ts src/lib/expert-offers/label.ts src/lib/expert-offers/label.test.ts
git commit -m "feat(offers): add packaged_offer type and frozen price branch"
```

---

### Task 3: BookBodySchema offerSlug

**Files:**
- Modify: `src/lib/book-request-schema.ts`
- Modify: `src/lib/book-request-schema.test.ts`

**Interfaces:**
- Consumes: `OFFER_SLUG_RE` from Task 1
- Produces: `BookBody.offerSlug?: string`; `serviceType` optional when `offerSlug` set; campaign + offerSlug invalid; comp grant + offerSlug invalid; `serviceType` if present with offer must be `packaged_offer`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/book-request-schema.test.ts`:

```ts
  it('accepts offerSlug with mentorId and omits serviceType', () => {
    const parsed = BookBodySchema.parse({
      mentorId: validBody.mentorId,
      offerSlug: 'book-lessons-and-how-to-apply-them',
      scheduledAt: validBody.scheduledAt,
      goals: validBody.goals,
      background: validBody.background,
    });
    expect(parsed.offerSlug).toBe('book-lessons-and-how-to-apply-them');
    expect(parsed.serviceType).toBeUndefined();
  });

  it('rejects offerSlug combined with campaign=chris', () => {
    const result = BookBodySchema.safeParse({
      ...validBody,
      offerSlug: 'thesis-dissertation-review',
      campaign: 'chris',
    });
    expect(result.success).toBe(false);
  });

  it('rejects offerSlug combined with a comp grant', () => {
    const result = BookBodySchema.safeParse({
      ...validBody,
      offerSlug: 'strategy-call',
      applyCompGrantId: 'a0000002-0000-4000-8000-000000000099',
    });
    expect(result.success).toBe(false);
  });

  it('rejects offerSlug without mentorId', () => {
    const result = BookBodySchema.safeParse({
      offerSlug: 'strategy-call',
      scheduledAt: validBody.scheduledAt,
      goals: validBody.goals,
      background: validBody.background,
    });
    expect(result.success).toBe(false);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/book-request-schema.test.ts`

Expected: FAIL (unknown offerSlug / still requires serviceType).

- [ ] **Step 3: Implement**

In `src/lib/book-request-schema.ts`:

1. Import `OFFER_SLUG_RE` from `@/lib/expert-offers/constants`.
2. Change `serviceType` to:

```ts
    serviceType: z
      .enum(['session_1on1', 'pre_call_brief', 'packaged_offer'], {
        message: 'Select a session type.',
      })
      .optional(),
```

3. Add:

```ts
    offerSlug: z
      .string()
      .regex(OFFER_SLUG_RE, { message: 'Invalid offer.' })
      .optional(),
```

4. At the top of `superRefine`, after `isChris` is computed:

```ts
    if (data.offerSlug) {
      if (!data.mentorId) {
        ctx.addIssue({
          code: 'custom',
          message: 'Select a valid expert.',
          path: ['mentorId'],
        });
      }
      if (data.serviceType && data.serviceType !== 'packaged_offer') {
        ctx.addIssue({
          code: 'custom',
          message: 'Packaged sessions cannot mix with another session type.',
          path: ['serviceType'],
        });
      }
      if (isChris) {
        ctx.addIssue({
          code: 'custom',
          message: 'This session is booked from its share link, not the campaign checkout.',
          path: ['offerSlug'],
        });
      }
      if (data.applyCompGrantId) {
        ctx.addIssue({
          code: 'custom',
          message: 'Complimentary sessions do not apply to packaged offers.',
          path: ['applyCompGrantId'],
        });
      }
    } else if (!data.serviceType) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a session type.',
        path: ['serviceType'],
      });
    }
```

Keep existing goals/background/lead-time refinements. Skip the Chris-only duration clamp when `data.offerSlug` is set (the `if (!isChris) return;` already exits before Chris checks when campaign is absent).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/book-request-schema.test.ts`

Expected: PASS. Existing `parse(validBody)` equality still holds (`offerSlug` omitted).

- [ ] **Step 5: Commit**

```bash
git add src/lib/book-request-schema.ts src/lib/book-request-schema.test.ts
git commit -m "feat(offers): accept offerSlug on book request schema"
```

---

### Task 4: Migration + database types + RLS

**Files:**
- Create: `supabase/migrations/20260915120000_expert_offers.sql`
- Modify: `src/lib/database.types.ts`

**Interfaces:**
- Consumes: schema from the spec
- Produces: live tables `expert_offers`; `mentors.expert_offers_enabled`; `bookings.expert_offer_id`; `bookings.offer_snapshot`; enum `packaged_offer`; enum `expert_offer_status`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260915120000_expert_offers.sql` with the exact SQL from the spec §1 (enum, table, indexes, flag column, booking columns, allowlist UPDATE) **plus** RLS:

```sql
ALTER TABLE public.expert_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY expert_offers_public_published_select ON public.expert_offers
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.mentors m
      WHERE m.id = mentor_id
        AND m.compliance_status = 'approved'
        AND m.is_listed = true
        AND m.expert_offers_enabled = true
    )
  );

COMMENT ON COLUMN public.mentors.expert_offers_enabled IS
  'When true, mentor can create packaged live-session offers and the Services tab is visible.';
```

Do not add an assets table or storage bucket.

- [ ] **Step 2: Update `src/lib/database.types.ts`**

1. Add `'packaged_offer'` to `Enums.service_type`.
2. Add `expert_offer_status: ["draft", "published", "unpublished", "archived"]` to `Enums`.
3. On `mentors.Row` / `Insert` / `Update` add `expert_offers_enabled: boolean` (Insert/Update optional).
4. On `bookings.Row` add `expert_offer_id: string | null` and `offer_snapshot: Json | null`. Same on Insert/Update as optional.
5. Add `bookings` relationship:

```ts
          {
            foreignKeyName: "bookings_expert_offer_id_fkey"
            columns: ["expert_offer_id"]
            isOneToOne: false
            referencedRelation: "expert_offers"
            referencedColumns: ["id"]
          },
```

6. Add table `expert_offers` with Row/Insert/Update matching the migration columns, plus relationship to `mentors`.

Copy the shape of `video_requests` in the same file for style.

- [ ] **Step 3: Typecheck the touched types**

Run: `npx tsc --noEmit --pretty false 2>&1 | head -50`

Expected: no new errors in `database.types.ts` / `types.ts`. Pre-existing lint/tsc noise elsewhere is OK; do not “fix” unrelated files.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260915120000_expert_offers.sql src/lib/database.types.ts
git commit -m "feat(offers): add expert_offers schema, flag, and booking snapshot columns"
```

Apply the migration to the hosted project in the same session if you have Supabase access (`npx supabase db push` or the dashboard SQL editor). Local app against hosted DB will 500 on offer APIs until this is applied.

---

### Task 5: Publish guards + mentor resolve + list/create/patch API

**Files:**
- Create: `src/lib/expert-offers/guards.ts`
- Create: `src/lib/expert-offers/guards.test.ts`
- Create: `src/lib/expert-offers/resolve-mentor.ts`
- Create: `src/lib/expert-offers/schema.ts`
- Create: `src/app/api/mentor/offers/route.ts`
- Create: `src/app/api/mentor/offers/[offerId]/route.ts`

**Interfaces:**
- Consumes: constants, slug helpers, `offerPublicPath`, `ExpertOfferListItem`
- Produces:
  - `type PublishMentor = { expert_offers_enabled: boolean; stripe_onboarding_completed: boolean; compliance_status: string; is_listed: boolean; slug: string | null }`
  - `assertCanPublish(mentor: PublishMentor, publishedCount: number): string | null` — returns error message or null
  - `canEditPriceDuration(args: { publishedAt: string | null; hasPaidBooking: boolean }): boolean`
  - `canEditSlug(publishedAt: string | null): boolean`
  - `assertCanArchive(hasUpcomingConfirmed: boolean): string | null`
  - `resolveMentorForSession(session: { userId: string; email: string }): Promise<{ id: string; slug: string | null; ... } | null>`
  - GET `/api/mentor/offers` → `{ items: ExpertOfferListItem[] }`
  - POST `/api/mentor/offers` → created draft + `public_url`
  - GET/PATCH `/api/mentor/offers/[offerId]`

- [ ] **Step 1: Write failing guard tests**

Create `src/lib/expert-offers/guards.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  assertCanArchive,
  assertCanPublish,
  canEditPriceDuration,
  canEditSlug,
} from '@/lib/expert-offers/guards';

const ready = {
  expert_offers_enabled: true,
  stripe_onboarding_completed: true,
  compliance_status: 'approved',
  is_listed: true,
  slug: 'demo-expert',
};

describe('assertCanPublish', () => {
  it('returns null when the mentor is ready and under the cap', () => {
    expect(assertCanPublish(ready, 0)).toBeNull();
  });

  it('blocks when the flag is off', () => {
    expect(assertCanPublish({ ...ready, expert_offers_enabled: false }, 0)).toMatch(/not enabled/i);
  });

  it('blocks incomplete Stripe, unapproved, unlisted, and the 5-offer cap', () => {
    expect(assertCanPublish({ ...ready, stripe_onboarding_completed: false }, 0)).toMatch(/payout/i);
    expect(assertCanPublish({ ...ready, compliance_status: 'pending_review' }, 0)).toMatch(/approved/i);
    expect(assertCanPublish({ ...ready, is_listed: false }, 0)).toMatch(/listed/i);
    expect(assertCanPublish(ready, 5)).toMatch(/5/);
  });
});

describe('edit rules', () => {
  it('freezes slug after first publish', () => {
    expect(canEditSlug(null)).toBe(true);
    expect(canEditSlug('2026-09-15T00:00:00.000Z')).toBe(false);
  });

  it('freezes price and duration after a paid booking', () => {
    expect(canEditPriceDuration({ publishedAt: null, hasPaidBooking: false })).toBe(true);
    expect(canEditPriceDuration({ publishedAt: '2026-09-15T00:00:00.000Z', hasPaidBooking: false })).toBe(true);
    expect(canEditPriceDuration({ publishedAt: '2026-09-15T00:00:00.000Z', hasPaidBooking: true })).toBe(false);
  });

  it('blocks archive when an upcoming confirmed booking exists', () => {
    expect(assertCanArchive(false)).toBeNull();
    expect(assertCanArchive(true)).toMatch(/upcoming/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/expert-offers/guards.test.ts`

Expected: FAIL module not found.

- [ ] **Step 3: Implement guards + Zod body + resolveMentor + routes**

Create `src/lib/expert-offers/guards.ts`:

```ts
import { OFFER_PUBLISHED_CAP } from '@/lib/expert-offers/constants';

export type PublishMentor = {
  expert_offers_enabled: boolean;
  stripe_onboarding_completed: boolean;
  compliance_status: string;
  is_listed: boolean;
  slug: string | null;
};

export function assertCanPublish(mentor: PublishMentor, publishedCount: number): string | null {
  if (!mentor.expert_offers_enabled) {
    return 'Packaged sessions are not enabled for this account.';
  }
  if (!mentor.stripe_onboarding_completed) {
    return 'Finish payout setup before publishing a session.';
  }
  if (mentor.compliance_status !== 'approved') {
    return 'Your listing must be approved before publishing.';
  }
  if (!mentor.is_listed) {
    return 'Your listing must be public before publishing.';
  }
  if (!mentor.slug) {
    return 'Add a public profile slug before publishing.';
  }
  if (publishedCount >= OFFER_PUBLISHED_CAP) {
    return `You can publish up to ${OFFER_PUBLISHED_CAP} sessions. Unpublish one first.`;
  }
  return null;
}
```

Continue in the same file:

```ts
export function canEditSlug(publishedAt: string | null): boolean {
  return publishedAt == null;
}

export function canEditPriceDuration(args: {
  publishedAt: string | null;
  hasPaidBooking: boolean;
}): boolean {
  return !args.hasPaidBooking;
}

export function assertCanArchive(hasUpcomingConfirmed: boolean): string | null {
  if (hasUpcomingConfirmed) {
    return 'This session has an upcoming confirmed booking. Unpublish it instead.';
  }
  return null;
}
```

Create `src/lib/expert-offers/schema.ts`:

```ts
import { z } from 'zod';
import {
  OFFER_DESCRIPTION_MAX,
  OFFER_DESCRIPTION_MIN,
  OFFER_DURATIONS,
  OFFER_PRICE_MAX_CENTS,
  OFFER_PRICE_MIN_CENTS,
  OFFER_TITLE_MAX,
  OFFER_TITLE_MIN,
} from '@/lib/expert-offers/constants';

export const OfferWriteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(OFFER_TITLE_MIN, { message: `Title must be at least ${OFFER_TITLE_MIN} characters.` })
    .max(OFFER_TITLE_MAX, { message: `Title must be at most ${OFFER_TITLE_MAX} characters.` }),
  description: z
    .string()
    .trim()
    .min(OFFER_DESCRIPTION_MIN, {
      message: `Description must be at least ${OFFER_DESCRIPTION_MIN} characters.`,
    })
    .max(OFFER_DESCRIPTION_MAX, {
      message: `Description must be at most ${OFFER_DESCRIPTION_MAX} characters.`,
    }),
  duration_minutes: z
    .number()
    .int()
    .refine((n) => (OFFER_DURATIONS as readonly number[]).includes(n), {
      message: 'Duration must be 15, 30, 45, or 60 minutes.',
    }),
  price_cents: z
    .number()
    .int()
    .min(OFFER_PRICE_MIN_CENTS, { message: 'Price must be at least $10.' })
    .max(OFFER_PRICE_MAX_CENTS, { message: 'Price must be at most $500.' }),
});

export const OfferPatchSchema = OfferWriteSchema.partial();
```

Create `src/lib/expert-offers/resolve-mentor.ts` (`import 'server-only'`):

```ts
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';

export const MENTOR_OFFER_FIELDS =
  'id, slug, email, expert_offers_enabled, stripe_onboarding_completed, compliance_status, is_listed';

export type MentorOfferRow = {
  id: string;
  slug: string | null;
  email: string;
  expert_offers_enabled: boolean;
  stripe_onboarding_completed: boolean;
  compliance_status: string;
  is_listed: boolean;
};

export async function resolveMentorForSession(session: {
  userId: string;
  email: string;
}): Promise<MentorOfferRow | null> {
  const { data: byUser } = await supabaseAdmin
    .from('mentors')
    .select(MENTOR_OFFER_FIELDS)
    .eq('user_id', session.userId)
    .maybeSingle();
  if (byUser) return byUser as MentorOfferRow;

  const { data: byEmail } = await supabaseAdmin
    .from('mentors')
    .select(MENTOR_OFFER_FIELDS)
    .eq('email', session.email)
    .maybeSingle();
  return (byEmail as MentorOfferRow | null) ?? null;
}
```

Create `src/app/api/mentor/offers/route.ts`:

- `GET`: `requireApiRole('mentor')` (admin also OK if you match video-requests: mentor **or** admin). Resolve mentor. If `!expert_offers_enabled` return 403 `{ error: 'Packaged sessions are not enabled for this account.' }`. List rows for `mentor_id`, order published first (`status = published` then `updated_at desc` — simplest: `.order('status').order('updated_at', { ascending: false })` then sort in JS: published, draft, unpublished, archived). Map `public_url` with `offerPublicPath(mentor.slug ?? mentor.id, row.slug)`.
- `POST`: parse `OfferWriteSchema`. Generate slug via `nextOfferSlug(slugifyOfferTitle(title), existingSlugs)`. Insert `status: 'draft'`. Return the row + `public_url`. 403 if flag off.

Create `src/app/api/mentor/offers/[offerId]/route.ts`:

- Load offer by id + `mentor_id`. 404 if missing.
- `GET`: detail.
- `PATCH`: parse `OfferPatchSchema`. If `status === 'archived'` → 400. If title changes and `canEditSlug(published_at)`, regenerate slug (collision-aware). If duration/price in patch and `!canEditPriceDuration({ publishedAt, hasPaidBooking })` → 400 `"Create a new session to change price or duration."`. `hasPaidBooking` = exists booking with this `expert_offer_id` and status in `('confirmed','completed')`.

- [ ] **Step 4: Run guard tests**

Run: `npm test -- src/lib/expert-offers/guards.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/expert-offers/guards.ts src/lib/expert-offers/guards.test.ts src/lib/expert-offers/resolve-mentor.ts src/lib/expert-offers/schema.ts src/app/api/mentor/offers/
git commit -m "feat(offers): add mentor offer CRUD API and publish guards"
```

---

### Task 6: Publish / unpublish / archive

**Files:**
- Create: `src/app/api/mentor/offers/[offerId]/publish/route.ts`
- Create: `src/app/api/mentor/offers/[offerId]/unpublish/route.ts`
- Create: `src/app/api/mentor/offers/[offerId]/archive/route.ts`
- Create: `src/lib/expert-offers/status.test.ts` (pure timestamp helpers if you extract them; otherwise keep logic in the routes and test `assertCanPublish` / `assertCanArchive` only — already done). Add `src/lib/expert-offers/status.ts` for the transition table so it is unit-tested.

**Interfaces:**
- Consumes: `assertCanPublish`, `assertCanArchive`, `isBookingUpcoming` from `@/lib/booking-partition`
- Produces:
  - `applyOfferTransition(status, action): { status, published_at, unpublished_at, archived_at } | { error: string }`
  - POST publish / unpublish / archive

- [ ] **Step 1: Write failing transition tests**

Create `src/lib/expert-offers/status.ts` tests in `src/lib/expert-offers/status.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyOfferTransition } from '@/lib/expert-offers/status';

describe('applyOfferTransition', () => {
  const now = '2026-09-15T12:00:00.000Z';

  it('draft → published sets published_at once', () => {
    const next = applyOfferTransition(
      { status: 'draft', published_at: null, unpublished_at: null, archived_at: null },
      'publish',
      now,
    );
    expect(next).toEqual({
      status: 'published',
      published_at: now,
      unpublished_at: null,
      archived_at: null,
    });
  });

  it('republish keeps original published_at', () => {
    const next = applyOfferTransition(
      {
        status: 'unpublished',
        published_at: '2026-09-01T00:00:00.000Z',
        unpublished_at: now,
        archived_at: null,
      },
      'publish',
      now,
    );
    expect(next).toMatchObject({
      status: 'published',
      published_at: '2026-09-01T00:00:00.000Z',
      unpublished_at: null,
    });
  });

  it('publish from archived fails', () => {
    expect(
      applyOfferTransition(
        { status: 'archived', published_at: now, unpublished_at: null, archived_at: now },
        'publish',
        now,
      ),
    ).toEqual({ error: 'Archived sessions cannot be published.' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/expert-offers/status.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement status helper + three POST routes**

Create `src/lib/expert-offers/status.ts`:

```ts
import type { ExpertOfferStatus } from '@/lib/expert-offers/types';

export type OfferTimestamps = {
  status: ExpertOfferStatus;
  published_at: string | null;
  unpublished_at: string | null;
  archived_at: string | null;
};

export function applyOfferTransition(
  current: OfferTimestamps,
  action: 'publish' | 'unpublish' | 'archive',
  nowIso: string,
): OfferTimestamps | { error: string } {
  if (action === 'archive') {
    return {
      status: 'archived',
      published_at: current.published_at,
      unpublished_at: current.unpublished_at,
      archived_at: nowIso,
    };
  }
  if (current.status === 'archived') {
    return { error: 'Archived sessions cannot be published.' };
  }
  if (action === 'publish') {
    if (current.status !== 'draft' && current.status !== 'unpublished') {
      return { error: 'Only draft or unpublished sessions can be published.' };
    }
    return {
      status: 'published',
      published_at: current.published_at ?? nowIso,
      unpublished_at: null,
      archived_at: null,
    };
  }
  if (current.status !== 'published') {
    return { error: 'Only published sessions can be unpublished.' };
  }
  return {
    status: 'unpublished',
    published_at: current.published_at,
    unpublished_at: nowIso,
    archived_at: null,
  };
}
```

Each POST route: auth + resolve mentor + load offer. Publish: count published, `assertCanPublish`, `applyOfferTransition(..., 'publish')`, update. Unpublish: transition. Archive: query confirmed bookings for this offer, `isBookingUpcoming` on each, `assertCanArchive`, then transition.

Return 409 when archive is blocked. Return 400 for invalid transitions.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/lib/expert-offers/status.test.ts src/lib/expert-offers/guards.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/expert-offers/status.ts src/lib/expert-offers/status.test.ts src/app/api/mentor/offers/
git commit -m "feat(offers): add publish, unpublish, and archive transitions"
```

---

### Task 7: Services tab on the mentor dashboard

**Files:**
- Modify: `src/app/dashboard/mentor/mentor-dashboard-nav.tsx`
- Modify: `src/app/dashboard/mentor/mentor-dashboard-client.tsx`
- Modify: `src/app/dashboard/mentor/page.tsx`
- Create: `src/app/dashboard/mentor/mentor-offers-panel.tsx`

**Interfaces:**
- Consumes: `/api/mentor/offers*` from Tasks 5–6, `dollarsToPriceCents`, `formatMoney` from `@/lib/format`
- Produces: sidebar tab `offers` labeled **Services**, visible only when `expertOffersEnabled`; list + create/edit/publish

- [ ] **Step 1: Nav type + item**

In `mentor-dashboard-nav.tsx`:

- Extend `MentorDashboardTab` with `'offers'`.
- Add icon `'offers'` (simple tag/price glyph, same 16×16 stroke as siblings).
- Insert into `PRIMARY_NAV` **after Sessions, before Videos**:

```ts
  { id: 'offers', label: 'Services', icon: 'offers' },
```

`MentorDashboardNav` gains optional `showOffersTab?: boolean` (default false). When false, filter `PRIMARY_NAV` to exclude `offers`.

- [ ] **Step 2: Dashboard page selects the flag**

In `src/app/dashboard/mentor/page.tsx` add `expert_offers_enabled` to the mentor select list. Pass `expertOffersEnabled: Boolean(mentor.expert_offers_enabled)` on `mentorProfile`.

Extend `MentorProfileState` in the client with `expertOffersEnabled: boolean` (default false in `emptyProfileFromSession`).

- [ ] **Step 3: Panel**

Create `mentor-offers-panel.tsx` (client component):

- `data-testid="mentor-offers-tab"`
- Header via `MentorPageHeader` title `Services`, description: `Package one conversation you already run. Share the link. This is beta — it will not appear on the homepage.`
- `GET /api/mentor/offers` on mount.
- Empty state uses that same sentence plus a **Create session** button.
- List rows (`data-testid={`mentor-offer-row-${id}`}`): title, status, `formatMoney(price_cents)`, duration, public URL + copy button (`data-testid="mentor-offer-copy-url"` copies `window.location.origin + public_url`), views, paid bookings.
- Sort client-side: published, draft, unpublished, archived.
- Create/edit form: title, description, duration `<select>` of 15/30/45/60, price dollars input. Save POST (create) or PATCH. Publish / unpublish / archive buttons calling the POST routes. Show `public_url` on the publish CTA.
- Hide price/duration inputs when the PATCH API would reject (after a paid booking: disable those fields; helper text “Create a new session to change price or duration.”). Simplest: disable duration/price whenever `status !== 'draft' && bookings_paid > 0`.

Use existing `md-*` classes from `mentor-dashboard.css` (cards, field stack, primary buttons) — do not invent a new visual system.

- [ ] **Step 4: Wire the tab**

In `mentor-dashboard-client.tsx`:

```tsx
{activeTab === 'offers' && profile.expertOffersEnabled ? <MentorOffersPanel /> : null}
```

Pass `showOffersTab={profile.expertOffersEnabled}` into `MentorDashboardNav`.

Existing E2E `e2e/mentor-dashboard.spec.ts` clicks Sessions/Earnings. Chris seed has the flag **false**, so the Services tab must **not** appear. After this task, run:

`npm test -- src/lib/expert-offers/`

and, if port-safe: `npx playwright test e2e/mentor-dashboard.spec.ts` — overview still loads; `mentor-tab-offers` count is 0 for the default mentor.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/mentor/
git commit -m "feat(offers): add Services tab for flag-on mentors"
```

---

### Task 8: Public page + view counter

**Files:**
- Create: `src/lib/expert-offers/load-public-offer.ts`
- Create: `src/lib/expert-offers/counters.ts`
- Create: `src/app/api/offers/public/[mentorSlug]/[offerSlug]/view/route.ts`
- Create: `src/app/s/[mentorSlug]/[offerSlug]/page.tsx`
- Create: `src/app/s/[mentorSlug]/[offerSlug]/offer-public-client.tsx`
- Create: `src/lib/expert-offers/public-access.ts`
- Create: `src/lib/expert-offers/public-access.test.ts`

**Interfaces:**
- Consumes: `offerPublicPath`, mentor directory `ListedExpert` / `getMentorBySlug`
- Produces:
  - `isOfferPubliclyBookable(args): boolean`
  - `loadPublicOffer(mentorSlug, offerSlug)` → `{ offer, expert } | null`
  - `incrementOfferCounter(offerId, 'page_views' | 'checkout_starts' | 'bookings_paid')`
  - Public page 404 unless bookable
  - View POST increments `page_views`

- [ ] **Step 1: Write failing bookable predicate tests**

Create `src/lib/expert-offers/public-access.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isOfferPubliclyBookable } from '@/lib/expert-offers/public-access';

describe('isOfferPubliclyBookable', () => {
  const ok = {
    status: 'published' as const,
    expert_offers_enabled: true,
    compliance_status: 'approved',
    is_listed: true,
  };

  it('allows published offers on approved listed flag-on mentors', () => {
    expect(isOfferPubliclyBookable(ok)).toBe(true);
  });

  it('rejects draft, unpublished, archived, flag-off, unlisted, unapproved', () => {
    expect(isOfferPubliclyBookable({ ...ok, status: 'draft' })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, status: 'unpublished' })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, status: 'archived' })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, expert_offers_enabled: false })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, is_listed: false })).toBe(false);
    expect(isOfferPubliclyBookable({ ...ok, compliance_status: 'pending_review' })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/expert-offers/public-access.test.ts`

Expected: FAIL module not found.

- [ ] **Step 3: Implement**

Create `src/lib/expert-offers/public-access.ts` with `isOfferPubliclyBookable` matching the tests (no `server-only`).

Create `src/lib/expert-offers/counters.ts` (`server-only`):

```ts
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';

export type OfferCounter = 'page_views' | 'checkout_starts' | 'bookings_paid';

export async function incrementOfferCounter(offerId: string, column: OfferCounter): Promise<void> {
  const { data } = await supabaseAdmin
    .from('expert_offers')
    .select(column)
    .eq('id', offerId)
    .maybeSingle();
  const current = Number((data as Record<string, number> | null)?.[column] ?? 0);
  await supabaseAdmin
    .from('expert_offers')
    .update({ [column]: current + 1, updated_at: new Date().toISOString() })
    .eq('id', offerId);
}
```

Create `src/lib/expert-offers/load-public-offer.ts` (`server-only`): join offer by mentor slug + offer slug via `supabaseAdmin`. Select mentor public fields. Return null unless `isOfferPubliclyBookable`.

View route: look up the offer the same way; if not bookable return 404; else increment `page_views` and return `{ ok: true }`. No auth.

Public page: `notFound()` when loader returns null. Render one screen:

1. Expert image, name, `publicExpertTitle` / existing role
2. Offer title, duration, `formatMoney(price_cents)`
3. Description
4. “What you get: live video · N minutes”
5. Primary link **Book this session** → `/booking?mentor={slug}&offer={offerSlug}` (`data-testid="offer-book-cta"`)
6. Secondary **View full profile** → `/experts/{slug}`

Client island `offer-public-client.tsx` fires `POST /api/offers/public/.../view` once on mount (`keepalive` fetch). Do not block render on it.

Follow `DESIGN.md` and existing expert profile tokens (`bg-surface`, `border-outline-variant`, Montserrat). No other experts. No duration slider.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/lib/expert-offers/public-access.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/expert-offers/ src/app/s/ src/app/api/offers/
git commit -m "feat(offers): add public share page and view counter"
```

---

### Task 9: Booking agent lock-in + counters

**Files:**
- Modify: `src/services/agents/booking-agent.ts`
- Modify: `src/app/api/book/route.ts`
- Modify: `src/app/api/book/route.test.ts`
- Modify: `src/lib/post-payment.ts`
- Modify: `src/lib/post-payment.test.ts`
- Modify: `src/services/agents/booking-agent.test.ts` (add offer cases if the suite already mocks supabase)

**Interfaces:**
- Consumes: `computeBookingTotalCents` `offerPriceCents`, `OfferSnapshot`, `incrementOfferCounter`, `isOfferPubliclyBookable`
- Produces: `bookSession({ offerSlug?: string })` charges offer price, writes snapshot, increments `checkout_starts`; first confirm increments `bookings_paid`

- [ ] **Step 1: Extend POST /api/book tests**

In `src/app/api/book/route.test.ts` add:

```ts
  it('passes offerSlug through to the agent and does not send a campaign', async () => {
    mockGetSession.mockResolvedValue({ userId: 'mentee-1', role: 'mentee' });
    mockBookSession.mockResolvedValue({
      bookingId: 'b1',
      stripeClientSecret: 'sec',
      skipPayment: true,
      matchReason: null,
      amountCents: 1000,
      mentorId: 'm1',
      mentorSlug: 'demo',
      mentorName: 'Demo',
      aiMatchReason: null,
      matchedByGemini: false,
    });

    const res = await POST(
      new Request('http://localhost/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: 'a0000002-0000-4000-8000-000000000002',
          offerSlug: 'strategy-call',
          scheduledAt: '2030-06-15T18:00:00.000Z',
          goals: 'Understand commercial crew certification path for our vehicle.',
          background: 'Series A space startup building reusable orbital tug with 12 engineers.',
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockBookSession).toHaveBeenCalledWith(
      expect.objectContaining({
        offerSlug: 'strategy-call',
        serviceType: 'packaged_offer',
        applyCompGrantId: undefined,
      }),
    );
  });
```

- [ ] **Step 2: Run to verify fail or red assertion**

Run: `npm test -- src/app/api/book/route.test.ts`

Expected: FAIL until route passes `offerSlug`.

- [ ] **Step 3: Implement route + agent + paid counter**

`src/app/api/book/route.ts` after parse:

```ts
    const isOffer = Boolean(body.offerSlug);
    const serviceType = isOffer ? 'packaged_offer' : body.serviceType;
    if (!serviceType) {
      return NextResponse.json({ success: false, error: 'Select a session type.' }, { status: 400 });
    }
```

Pass `offerSlug: body.offerSlug` into `bookSession`. When `isOffer`, do **not** clamp duration via Chris helper; pass `durationMinutes` through (agent ignores it).

In `BookingAgent.bookSession` add `offerSlug?: string`. After mentor lookup (offer bookings **require** `params.mentorId` — do not run Gemini match):

```ts
    if (params.offerSlug) {
      if (params.campaignId) {
        throw new Error('This session is booked from its share link, not the campaign checkout.');
      }
      if (params.applyCompGrantId) {
        throw new Error('Complimentary sessions do not apply to packaged offers.');
      }
    }
```

Load the offer: `mentor_id = finalMentorId`, `slug = offerSlug`. If missing or `!isOfferPubliclyBookable({ status, expert_offers_enabled: mentor.expert_offers_enabled, ... })` throw `'This session is not available.'`.

Select `expert_offers_enabled` on the mentor query (add to the existing select list).

Set:

```ts
    const durationMinutes = offer ? offer.duration_minutes : /* existing Chris/slider logic */;
    const serviceType = offer ? 'packaged_offer' : params.serviceType;
    const includePreCallBrief = serviceType === 'session_1on1' || serviceType === 'packaged_offer';
    let servicePriceCents = computeBookingTotalCents({
      serviceType,
      liveSessionPriceCents: mentor.live_session_price_cents,
      includePreCallBrief,
      durationMinutes,
      ...(offer ? { offerPriceCents: offer.price_cents } : {}),
    });
```

Chris pricing block must **not** run when `offer` is set.

On insert add:

```ts
      ...(offer
        ? {
            expert_offer_id: offer.id,
            offer_snapshot: {
              offer_id: offer.id,
              title: offer.title,
              slug: offer.slug,
              duration_minutes: offer.duration_minutes,
              price_cents: offer.price_cents,
            },
          }
        : {}),
```

After successful insert, if offer: `await incrementOfferCounter(offer.id, 'checkout_starts')`.

Stripe metadata: add `offer_id` when present.

`confirmBookingWithoutPayment` / `fulfillBookingAfterPayment`: when `alreadyProcessed` is false, load `expert_offer_id` with the booking (add to the select). If set, `incrementOfferCounter(expert_offer_id, 'bookings_paid')`.

Extend `src/lib/post-payment.test.ts`: mock the extra select field `expert_offer_id: null` so existing tests keep passing. Add one test that when `expert_offer_id` is `'offer-1'` and status is `pending_payment`, confirm calls increment. Easiest: mock `@/lib/expert-offers/counters` `incrementOfferCounter` and assert it is called with `('offer-1', 'bookings_paid')`.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/app/api/book/route.test.ts src/lib/post-payment.test.ts src/services/agents/booking-agent.test.ts src/lib/booking-pricing.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/book/route.ts src/app/api/book/route.test.ts src/services/agents/booking-agent.ts src/services/agents/booking-agent.test.ts src/lib/post-payment.ts src/lib/post-payment.test.ts
git commit -m "feat(offers): lock /api/book price and duration to the offer SKU"
```

---

### Task 10: Briefing + booking list labels + email

**Files:**
- Modify: `src/services/agents/briefing-agent.ts`
- Modify: `src/lib/mentee-bookings.ts`
- Modify: `src/lib/mentor-bookings.ts`
- Modify: `src/lib/mentor-booking-partition.ts`
- Modify: `src/lib/booking-partition.ts`
- Modify: `src/app/dashboard/mentee/mentee-dashboard-client.tsx`
- Modify: `src/app/dashboard/mentor/mentor-consultation-card.tsx`
- Modify: `src/lib/email/booking-confirmed-templates.ts`
- Modify: `src/lib/email/booking-confirmed-templates.test.ts`
- Modify: `src/services/agents/notification-agent.ts`

**Interfaces:**
- Consumes: `formatOfferBookingLabel`, `OfferSnapshot`
- Produces: `packaged_offer` uses dual 1:1 briefing; dashboards and email show snapshot title

- [ ] **Step 1: Email test**

In `booking-confirmed-templates.test.ts`:

```ts
  it('uses the offer snapshot title for packaged_offer bookings', () => {
    const email = buildMenteeConfirmationEmail({
      ...baseContext,
      serviceType: 'packaged_offer',
      durationMinutes: 45,
      offerTitle: 'Book lessons and how to apply them',
    });
    expect(email.html).toContain('Book lessons and how to apply them (45 min)');
    expect(email.html).not.toContain('Packaged session (45 min)');
  });
```

- [ ] **Step 2: Run to verify fail**

Run: `npm test -- src/lib/email/booking-confirmed-templates.test.ts`

Expected: FAIL (`offerTitle` not on context).

- [ ] **Step 3: Implement**

`BriefingAgent.prepareBriefing`: change

```ts
    if (service_type === 'session_1on1' || service_type === 'extended_session') {
```

to

```ts
    if (
      service_type === 'session_1on1' ||
      service_type === 'extended_session' ||
      service_type === 'packaged_offer'
    ) {
```

`BookingEmailContext` add `offerTitle?: string | null`. `loadBookingContext` selects `offer_snapshot` and sets `offerTitle: snapshot?.title ?? null`.

`buildMenteeConfirmationEmail` (and mentor equivalent if it uses `formatServiceTypeLabel`):

```ts
  const serviceLabel = formatOfferBookingLabel({
    serviceType: ctx.serviceType,
    durationMinutes: ctx.durationMinutes,
    offerTitle: ctx.offerTitle,
  });
```

Mentee/mentor booking selects add `offer_snapshot`. Views add `offerTitle?: string | null` derived from `offer_snapshot.title`. Cards use `formatOfferBookingLabel`.

- [ ] **Step 4: Run tests**

Run: `npm test -- src/lib/email/booking-confirmed-templates.test.ts src/lib/expert-offers/label.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/agents/briefing-agent.ts src/lib/mentee-bookings.ts src/lib/mentor-bookings.ts src/lib/mentor-booking-partition.ts src/lib/booking-partition.ts src/app/dashboard/mentee/mentee-dashboard-client.tsx src/app/dashboard/mentor/mentor-consultation-card.tsx src/lib/email/booking-confirmed-templates.ts src/lib/email/booking-confirmed-templates.test.ts src/services/agents/notification-agent.ts
git commit -m "feat(offers): show offer title on briefs, dashboards, and confirmation email"
```

---

### Task 11: Booking page SKU lock-in

**Files:**
- Modify: `src/app/booking/page.tsx`
- Modify: `src/app/booking/booking-client.tsx`

**Interfaces:**
- Consumes: `loadPublicOffer`, `formatMoney`
- Produces: `/booking?mentor=&offer=` hides slider and picker, shows SKU chip, posts `offerSlug`

- [ ] **Step 1: Page loader**

Extend `searchParams` with `offer?: string`.

**Before** the `chrisCampaign` wizard branch:

```ts
  const offerSlugParam = offer?.trim() || null;

  if (offerSlugParam) {
    if (!session) {
      const returnQs = new URLSearchParams();
      if (mentorSlugParam?.trim()) returnQs.set('mentor', mentorSlugParam.trim());
      returnQs.set('offer', offerSlugParam);
      redirect(toAuthWithRedirect(`/booking?${returnQs.toString()}`));
    }
    const publicOffer = await loadPublicOffer(mentorSlugParam ?? '', offerSlugParam);
    if (!publicOffer || !mentor) {
      notFound();
    }
    // ... render BookingClient with offer={{ slug, title, durationMinutes, priceCents }}
    // chrisCampaign={false}
  }
```

Do not mount `ChrisBookingWizard` when `offer` is present.

- [ ] **Step 2: BookingClient**

Add prop:

```ts
  offer?: {
    slug: string;
    title: string;
    durationMinutes: number;
    priceCents: number;
  } | null;
```

When `offer` is set:

- Force `form.durationMinutes = offer.durationMinutes`.
- `pickerVisible = false`.
- Pass `showDurationSlider={false}` into the summary.
- Summary “Session” line shows `offer.title` and `formatMoney(offer.priceCents)` instead of `$X/hr`.
- `listTotalCents = offer.priceCents`.
- Disable comp-grant banner (`canApplyComp = false`).
- `submitBooking` payload:

```ts
      mentorId: activeMentor?.id,
      offerSlug: offer.slug,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      goals: form.goals,
      background: form.background,
```

Do **not** send `campaign`, `applyCompGrantId`, or a duration the server will trust. `serviceType` may be omitted.

Preserve `?offer=` in `replaceBookingQuery` if you keep that helper (picker is hidden, so it should not fire).

- [ ] **Step 3: Manual sanity (no browser tools required in this task)**

Run: `npm test -- src/lib/book-request-schema.test.ts src/lib/booking-pricing.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/booking/page.tsx src/app/booking/booking-client.tsx
git commit -m "feat(offers): lock booking checkout to the shared offer SKU"
```

---

### Task 12: E2E create → public → book

**Files:**
- Create: `e2e/expert-offers.spec.ts`
- Modify: `e2e/helpers/supabase-cleanup.ts` (or a sibling `e2e/helpers/expert-offers.ts`) — enable/disable flag for the logged-in E2E mentor, restore after

**Interfaces:**
- Consumes: mentor auth fixture, `SKIP_STRIPE_PAYMENTS=true` from Playwright webServer
- Produces: one Playwright spec that does not use `cpachecohernande631@access.alamancecc.edu`

- [ ] **Step 1: Helper**

```ts
export async function setMentorExpertOffersEnabled(email: string, enabled: boolean): Promise<void> {
  // supabaseAdmin update mentors.expert_offers_enabled where email
}

export async function deleteMentorOffers(mentorEmail: string): Promise<void> {
  // delete expert_offers for that mentor (tests only)
}
```

Use the same service-role pattern as `restoreChrisMentorEmployer`. If keys are missing, skip the spec (`test.skip`).

- [ ] **Step 2: Spec**

`e2e/expert-offers.spec.ts`:

1. `test.use({ storageState: mentorAuthFile })`.
2. `beforeAll`: enable flag on the E2E mentor email (`chris@astrolink.ai` unless the fixture differs). `afterAll`: disable flag + delete offers created by the test (title prefix `[e2e-offer]`).
3. Open `/dashboard/mentor`, click `mentor-tab-offers`, expect `mentor-offers-tab`.
4. Create offer: title `[e2e-offer] Strategy working session`, description ≥ 40 chars, duration 45, price 10. Publish.
5. Copy URL / read `public_url` from the row. `page.goto` that path as a **fresh context** (no mentor cookie) — or just `expect` the mentor still sees the public page. Public page: heading is the title, CTA `offer-book-cta`.
6. Homepage (`/`) and `/experts` do not contain the string `Packaged sessions` or the offer title.
7. Optional booking: mentee auth storage, open `/booking?mentor={slug}&offer={slug}`, expect no duration slider (`input[type=range]` count 0), summary shows `$10.00`. Filling goals/background/datetime and submit is in-scope if skip-payments is on; assert mentee dashboard contains the offer title.

Keep the spec skip-safe when Supabase admin is unavailable.

Also add a short test in `e2e/mentor-dashboard.spec.ts` (default flag off):

```ts
await expect(page.getByTestId('mentor-tab-offers')).toHaveCount(0);
```

- [ ] **Step 3: Run**

Run: `npm run test:e2e -- e2e/expert-offers.spec.ts e2e/mentor-dashboard.spec.ts`

Expected: PASS. Free port 3000 first if a leftover dev server is bound.

- [ ] **Step 4: Commit**

```bash
git add e2e/expert-offers.spec.ts e2e/helpers/ e2e/mentor-dashboard.spec.ts
git commit -m "test(offers): e2e create, share URL, and locked checkout"
```

---

## Decision ledger

| # | Finding | Disposition | Owner / next step |
|---|---------|-------------|-------------------|
| 1 | Weekly hours / Google Calendar | Rejected | Reuse datetime picker (spec locked) |
| 2 | Duration 90 | Rejected | 15/30/45/60 only |
| 3 | Prep files / assets table | Rejected | Description is the prep field |
| 4 | Chris campaign wizard for offers | Rejected | Generic locked-SKU page; offer wins over campaign query |
| 5 | Nested `/dashboard/mentor/offers` routes | Rejected | Services tab on existing dashboard |
| 6 | Launch allowlist Eiman/Chris/David | Rejected | Flag true only for `cpachecohernande631@access.alamancecc.edu` in SQL |
| 7 | Hardcode allowlist email in app TS | Rejected | Column only |
| 8 | Profile / homepage chips | Rejected | Share-URL only |
| 9 | Admin offers API | Rejected | Ops uses the flag column |
| 10 | Comp grants on offers | Rejected | Schema + agent reject |
| 11 | Hosted migration apply | Accepted | Task 4 — push SQL to hosted Supabase when implementing |
| 12 | E2E uses production allowlist email | Rejected | Flip fixture mentor flag, restore after |

**Session outcome:** ship via this plan.

## Test ledger

| Planned check | Test file | Status |
|---------------|-----------|--------|
| Slugify + collision suffix | `src/lib/expert-offers/slug.test.ts` | add |
| Dollars → cents bounds | `src/lib/expert-offers/money.test.ts` | add |
| Offer price skips hourly proration | `src/lib/booking-pricing.test.ts` | add |
| Snapshot title beats Packaged session | `src/lib/expert-offers/label.test.ts` | add |
| offerSlug vs campaign / comp grant | `src/lib/book-request-schema.test.ts` | add |
| Publish guards + 5-cap + freeze rules | `src/lib/expert-offers/guards.test.ts` | add |
| published_at set once | `src/lib/expert-offers/status.test.ts` | add |
| Public 404 predicate | `src/lib/expert-offers/public-access.test.ts` | add |
| `/api/book` passes offerSlug as packaged_offer | `src/app/api/book/route.test.ts` | add |
| bookings_paid increments once | `src/lib/post-payment.test.ts` | add |
| Confirmation email uses offer title | `src/lib/email/booking-confirmed-templates.test.ts` | add |
| Services tab hidden when flag off | `e2e/mentor-dashboard.spec.ts` | add |
| Create → public URL → locked book | `e2e/expert-offers.spec.ts` | add |

## Simplification

| Action | Target | Why now |
|--------|--------|---------|
| Remove | `expert_offer_assets`, storage bucket, signed URLs | Not needed to learn if a URL converts |
| Remove | Weekly hours table / Google Calendar | Live booking is datetime-local + 2-day lead |
| Remove | `buyer_prompt_*`, stored `public_path` | Goals/background and computed path already exist |
| Split | Offer domain under `src/lib/expert-offers/` | Keep `/api/book` and `booking-agent.ts` from growing another 200 lines of SKU rules |
| Merge | None | Do not merge into `video_requests` — different modality |
| Delete dead | None this PR | Flag default false; no homepage strings to delete |

Do **not** split `booking-client.tsx` in this plan unless it crosses ~500 *new* lines. Offer mode is a prop branch, not a second checkout.

## Engineering discipline closeout

**Decisions:** 10 rejected, 1 accepted, 1 rejected (E2E email), 0 need option  
**Tests:** 13 named files in the test ledger  
**Simplification:** 4 removals, 1 split, no new env flag  
**Next action:** Execute Task 1 (domain helpers) in an isolated worktree or this session.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| `packaged_offer` enum + `expert_offers` table + flag + snapshot | 4 |
| Duration 15/30/45/60, price $10–$500, cap 5 | 1, 5, 6 |
| Slug immutable after first publish | 5, 6 |
| Mentor CRUD + publish guards | 5, 6 |
| Services tab, flag-on only | 7 |
| Public `/s/...` 404 + view counter | 8 |
| `/api/book` offerSlug lock-in + counters | 9 |
| Briefing like 1:1; dashboard/email titles | 10 |
| Booking page hide slider | 11 |
| Chris wizard untouched; offer wins | 11 |
| Allowlist SQL only | 4 |
| No materials / hours / homepage | Global constraints + Tasks 4, 7, 8, 12 |
| E2E demand path | 12 |
