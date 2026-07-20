# Chris Goals-First Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the Chris booking wizard to session → account → payment, with a 48h localStorage draft, hybrid goals gate, landing live price, and goals-first analytics so paid conversion can improve without a full session-builder redesign.

**Architecture:** Keep existing `/talk-with-chris` + `/booking?campaign=chris` surfaces. Add a pure client draft module; Chris-scoped validation in `BookBodySchema`; rewrite wizard step machine and hydrate/resume; landing saves partial draft and shows `resolveChrisChargeCents`; analytics defaults flip to session-first. No new API routes; Stripe/book contract unchanged beyond optional background + duration already on branch.

**Tech Stack:** Next.js App Router, React client components, Zod (`BookBodySchema`), Vitest, Playwright, `localStorage`, Vercel Analytics track helpers.

**Spec:** `docs/superpowers/specs/2026-07-20-chris-goals-first-funnel-design.md`

## Global Constraints

- Chris-campaign scope only — do not change non-Chris booking step order or general goals/background min 10 for non-campaign payloads.
- `CHRIS_GOALS_MIN_CHARS = 50`; background optional when `campaign === 'chris'`.
- Draft key `astrolink:chris-booking-draft:v1`; backend `localStorage`; TTL **48 hours**.
- Post-auth / signed-in complete draft → **payment**; signed-out complete draft on mount → **account**.
- No incomplete-booking email; no email/OG meta rewrites; no admin BI.
- Prefer TDD: failing test → implement → pass → commit per task.
- Run unit tests with `npm test -- <path>` (Vitest). E2E with `npm run test:e2e -- e2e/talk-with-chris.spec.ts` only when port 3000 is free or Playwright starts its own server.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/chris-campaign/chris-campaign-constants.ts` | Add `CHRIS_GOALS_MIN_CHARS` |
| `src/lib/chris-campaign/chris-booking-draft.ts` | **Create** load/save/clear/TTL + `isChrisDraftSessionComplete` |
| `src/lib/chris-campaign/chris-booking-draft.test.ts` | **Create** draft unit tests |
| `src/lib/book-request-schema.ts` | Chris hybrid goals/background validation |
| `src/lib/book-request-schema.test.ts` | Chris empty background OK; goals min 50; non-Chris unchanged |
| `src/lib/chris-campaign/chris-campaign-analytics.ts` | Measurement checklist comment |
| `src/lib/chris-campaign/use-chris-wizard-analytics.ts` | Default `lastStep` = `session`; fix auth lastStep |
| `src/lib/chris-campaign/use-chris-wizard-analytics.test.ts` | Update if needed |
| `src/lib/chris-campaign/chris-campaign-analytics.test.ts` | Update if needed |
| `src/components/chris-campaign/chris-booking-wizard.tsx` | Step order, draft, banner, CTAs, edit from payment |
| `src/components/chris-campaign/chris-request-session-form.tsx` | Live price + partial draft on CTA |
| `src/components/chris-campaign/chris-mobile-booking-card.tsx` | Live price + partial draft if it has its own CTA |
| `src/components/chris-campaign/chris-landing.css` | DurationStepper contrast under Chris wrappers |
| `src/components/chris-campaign/chris-landing-client.tsx` | Hero/body de-hardcode 45-minute |
| `src/components/chris-campaign/chris-mobile-landing.tsx` | Hero de-hardcode 45-minute |
| `src/components/chris-campaign/chris-slot-picker.tsx` | Product UI “45-minute” sweep only |
| `e2e/talk-with-chris.spec.ts` | Goals-first flow, draft, optional background |

---

### Task 1: Draft module (`localStorage` + 48h TTL)

**Files:**
- Create: `src/lib/chris-campaign/chris-booking-draft.ts`
- Create: `src/lib/chris-campaign/chris-booking-draft.test.ts`
- Modify: `src/lib/chris-campaign/chris-campaign-constants.ts` (add goals min constant used later)

**Interfaces:**
- Consumes: none
- Produces:
  - `CHRIS_BOOKING_DRAFT_KEY = 'astrolink:chris-booking-draft:v1'`
  - `CHRIS_BOOKING_DRAFT_TTL_MS = 48 * 60 * 60 * 1000`
  - `CHRIS_GOALS_MIN_CHARS = 50` (constants file)
  - `type ChrisBookingDraft = { goals: string; background: string; durationMinutes: number; scheduledAt: string; date: string | null; marketingReferrer: string | null; updatedAt: number }`
  - `loadDraft(): ChrisBookingDraft | null`
  - `saveDraft( partial: Partial<Omit<ChrisBookingDraft, 'updatedAt'>> & Record<string, unknown> ): ChrisBookingDraft | null` — merges with existing, sets `updatedAt`
  - `clearDraft(): void`
  - `isDraftExpired(draft: { updatedAt: number }, now?: number): boolean`
  - `isChrisDraftSessionComplete(draft: Pick<ChrisBookingDraft, 'goals' | 'durationMinutes' | 'scheduledAt'>, goalsMin?: number): boolean` — trimmed goals length ≥ min, finite duration, non-empty scheduledAt

- [ ] **Step 1: Add constant**

In `src/lib/chris-campaign/chris-campaign-constants.ts` add:

```ts
/** Minimum goals length for Chris campaign session continue / book (conversion floor). */
export const CHRIS_GOALS_MIN_CHARS = 50;
```

- [ ] **Step 2: Write failing draft tests**

Create `src/lib/chris-campaign/chris-booking-draft.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHRIS_BOOKING_DRAFT_KEY,
  CHRIS_BOOKING_DRAFT_TTL_MS,
  clearDraft,
  isChrisDraftSessionComplete,
  isDraftExpired,
  loadDraft,
  saveDraft,
} from '@/lib/chris-campaign/chris-booking-draft';
import { CHRIS_GOALS_MIN_CHARS } from '@/lib/chris-campaign/chris-campaign-constants';

describe('chris-booking-draft', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('saveDraft + loadDraft round-trips fields and sets updatedAt', () => {
    const saved = saveDraft({
      goals: 'I want launch strategy advice for my STEM nonprofit program.',
      background: '',
      durationMinutes: 45,
      scheduledAt: '2030-08-15T12:00',
      date: '2030-08-15',
      marketingReferrer: 'chris-sembroski',
    });
    expect(saved?.goals).toContain('STEM');
    expect(saved?.updatedAt).toBeTypeOf('number');
    expect(loadDraft()?.goals).toBe(saved?.goals);
    expect(localStorage.getItem(CHRIS_BOOKING_DRAFT_KEY)).toBeTruthy();
  });

  it('loadDraft returns null and clears key when expired', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    saveDraft({ goals: 'enough characters for a real chris booking goal text here' });
    vi.setSystemTime(new Date(Date.now() + CHRIS_BOOKING_DRAFT_TTL_MS + 1));
    expect(loadDraft()).toBeNull();
    expect(localStorage.getItem(CHRIS_BOOKING_DRAFT_KEY)).toBeNull();
  });

  it('loadDraft returns null on corrupt JSON', () => {
    localStorage.setItem(CHRIS_BOOKING_DRAFT_KEY, '{not-json');
    expect(loadDraft()).toBeNull();
  });

  it('clearDraft removes the key', () => {
    saveDraft({ goals: 'enough characters for a real chris booking goal text here' });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('isDraftExpired is true after TTL', () => {
    const now = 1_000_000;
    expect(isDraftExpired({ updatedAt: now - CHRIS_BOOKING_DRAFT_TTL_MS - 1 }, now)).toBe(
      true,
    );
    expect(isDraftExpired({ updatedAt: now - 1000 }, now)).toBe(false);
  });

  it('isChrisDraftSessionComplete requires goals floor', () => {
    expect(
      isChrisDraftSessionComplete({
        goals: 'short',
        durationMinutes: 45,
        scheduledAt: '2030-08-15T12:00',
      }),
    ).toBe(false);
    expect(
      isChrisDraftSessionComplete({
        goals: 'x'.repeat(CHRIS_GOALS_MIN_CHARS),
        durationMinutes: 45,
        scheduledAt: '2030-08-15T12:00',
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm test -- src/lib/chris-campaign/chris-booking-draft.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 4: Implement draft module**

Create `src/lib/chris-campaign/chris-booking-draft.ts`:

```ts
/**
 * Client-only Chris booking draft (localStorage).
 * Goals text can be sensitive — 48h TTL, clear on successful payment.
 */
import { CHRIS_GOALS_MIN_CHARS } from '@/lib/chris-campaign/chris-campaign-constants';

export const CHRIS_BOOKING_DRAFT_KEY = 'astrolink:chris-booking-draft:v1';
export const CHRIS_BOOKING_DRAFT_TTL_MS = 48 * 60 * 60 * 1000;

export type ChrisBookingDraft = {
  goals: string;
  background: string;
  durationMinutes: number;
  scheduledAt: string;
  date: string | null;
  marketingReferrer: string | null;
  updatedAt: number;
};

function emptyDraft(now: number): ChrisBookingDraft {
  return {
    goals: '',
    background: '',
    durationMinutes: 45,
    scheduledAt: '',
    date: null,
    marketingReferrer: null,
    updatedAt: now,
  };
}

export function isDraftExpired(
  draft: { updatedAt: number },
  now: number = Date.now(),
): boolean {
  return now - draft.updatedAt > CHRIS_BOOKING_DRAFT_TTL_MS;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadDraft(): ChrisBookingDraft | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(CHRIS_BOOKING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChrisBookingDraft>;
    if (typeof parsed.updatedAt !== 'number') {
      clearDraft();
      return null;
    }
    if (isDraftExpired({ updatedAt: parsed.updatedAt })) {
      clearDraft();
      return null;
    }
    return {
      goals: typeof parsed.goals === 'string' ? parsed.goals : '',
      background: typeof parsed.background === 'string' ? parsed.background : '',
      durationMinutes:
        typeof parsed.durationMinutes === 'number' ? parsed.durationMinutes : 45,
      scheduledAt: typeof parsed.scheduledAt === 'string' ? parsed.scheduledAt : '',
      date: typeof parsed.date === 'string' ? parsed.date : null,
      marketingReferrer:
        typeof parsed.marketingReferrer === 'string' ? parsed.marketingReferrer : null,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    clearDraft();
    return null;
  }
}

export function saveDraft(
  partial: Partial<Omit<ChrisBookingDraft, 'updatedAt'>>,
): ChrisBookingDraft | null {
  if (!canUseStorage()) return null;
  const now = Date.now();
  const prev = loadDraft() ?? emptyDraft(now);
  const next: ChrisBookingDraft = {
    ...prev,
    ...partial,
    updatedAt: now,
  };
  try {
    window.localStorage.setItem(CHRIS_BOOKING_DRAFT_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(CHRIS_BOOKING_DRAFT_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function isChrisDraftSessionComplete(
  draft: Pick<ChrisBookingDraft, 'goals' | 'durationMinutes' | 'scheduledAt'>,
  goalsMin: number = CHRIS_GOALS_MIN_CHARS,
): boolean {
  const goals = draft.goals.trim();
  return (
    goals.length >= goalsMin &&
    Number.isFinite(draft.durationMinutes) &&
    draft.durationMinutes > 0 &&
    draft.scheduledAt.trim().length > 0
  );
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- src/lib/chris-campaign/chris-booking-draft.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/chris-campaign/chris-booking-draft.ts \
  src/lib/chris-campaign/chris-booking-draft.test.ts \
  src/lib/chris-campaign/chris-campaign-constants.ts
git commit -m "feat(chris): add 48h localStorage booking draft module"
```

---

### Task 2: Chris hybrid validation in `BookBodySchema`

**Files:**
- Modify: `src/lib/book-request-schema.ts`
- Modify: `src/lib/book-request-schema.test.ts`

**Interfaces:**
- Consumes: `CHRIS_GOALS_MIN_CHARS`, `CHRIS_BOOKING_CAMPAIGN_QUERY`
- Produces: Chris campaign payloads accept empty `background`; require goals ≥ 50; non-Chris still min 10/10

- [ ] **Step 1: Write failing tests** (append to `book-request-schema.test.ts`)

```ts
import { CHRIS_GOALS_MIN_CHARS } from '@/lib/chris-campaign/chris-campaign-constants';

// inside describe, after existing chrisFuture tests:

it('accepts campaign=chris with empty background and goals at floor', () => {
  const goals = 'G'.repeat(CHRIS_GOALS_MIN_CHARS);
  const parsed = BookBodySchema.parse({
    ...chrisFuture,
    goals,
    background: '',
  });
  expect(parsed.background).toBe('');
  expect(parsed.goals.length).toBe(CHRIS_GOALS_MIN_CHARS);
});

it('rejects campaign=chris when goals shorter than CHRIS_GOALS_MIN_CHARS', () => {
  const result = BookBodySchema.safeParse({
    ...chrisFuture,
    goals: 'G'.repeat(CHRIS_GOALS_MIN_CHARS - 1),
    background: '',
  });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.flatten().fieldErrors.goals?.[0]).toMatch(/prepare|characters|bit more/i);
  }
});

it('still requires non-Chris background min 10', () => {
  const result = BookBodySchema.safeParse({
    ...validBody,
    background: 'short',
  });
  expect(result.success).toBe(false);
});
```

Ensure `chrisFuture` goals string is ≥ 50 chars (lengthen the sample goals in `chrisFuture` / `validBody` if needed so existing chris tests still pass after schema change).

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- src/lib/book-request-schema.test.ts
```

Expected: FAIL on empty background / Chris goals floor

- [ ] **Step 3: Implement schema change**

In `src/lib/book-request-schema.ts`:

1. Import `CHRIS_GOALS_MIN_CHARS` from constants.
2. Change base `goals` and `background` to plain `z.string()` (or min 1 for goals only if preferred — prefer plain string + superRefine for both paths so messages stay human).
3. In `.superRefine`, **before** early return for non-chris, still run non-chris length checks; structure:

```ts
export const BookBodySchema = z
  .object({
    // ...unchanged fields except:
    goals: z.string(),
    background: z.string(),
    // durationMinutes etc unchanged
  })
  .superRefine((data, ctx) => {
    const isChris = data.campaign === CHRIS_BOOKING_CAMPAIGN_QUERY;
    const goalsTrim = data.goals.trim();
    const bgTrim = data.background.trim();

    if (isChris) {
      if (goalsTrim.length < CHRIS_GOALS_MIN_CHARS) {
        ctx.addIssue({
          code: 'custom',
          message: 'Add a bit more so Chris can prepare.',
          path: ['goals'],
        });
      }
      // background optional — no min
    } else {
      if (goalsTrim.length < 10) {
        ctx.addIssue({
          code: 'custom',
          message: 'Add at least 10 characters so your expert can prepare.',
          path: ['goals'],
        });
      }
      if (bgTrim.length < 10) {
        ctx.addIssue({
          code: 'custom',
          message: 'Add at least 10 characters about your background.',
          path: ['background'],
        });
      }
    }

    if (!isChris) {
      return;
    }

    // existing Chris-only duration / date / serviceType refinements...
  });
```

Keep existing Chris duration/date/serviceType refinements after the hybrid goals checks.

- [ ] **Step 4: Update existing tests that assume zod `.min(10)` default messages** if any fail; keep non-Chris behavior identical.

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- src/lib/book-request-schema.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/book-request-schema.ts src/lib/book-request-schema.test.ts
git commit -m "feat(chris): hybrid goals floor and optional background validation"
```

---

### Task 3: Analytics defaults for goals-first

**Files:**
- Modify: `src/lib/chris-campaign/use-chris-wizard-analytics.ts`
- Modify: `src/lib/chris-campaign/chris-campaign-analytics.ts` (measurement checklist comment at top)
- Modify tests under `src/lib/chris-campaign/*analytics*.test.ts` if they assert default step

**Interfaces:**
- Consumes: existing `ChrisWizardStep`
- Produces: `lastStepRef` initial value `'session'`; `reportAuthSuccess` sets last step to `'payment'` (not `'session'`)

- [ ] **Step 1: Write / update failing assertion**

In `use-chris-wizard-analytics.test.ts` or analytics test, add:

```ts
it('documents session-before-auth progress as session_only until checkout', () => {
  expect(
    resolveChrisWizardExitOutcome({
      authSuccess: false,
      sessionContinued: true,
      checkoutStarted: false,
      paid: false,
    }),
  ).toBe('session_only');
});
```

(If already present, skip.)

- [ ] **Step 2: Change default last step**

In `use-chris-wizard-analytics.ts`:

```ts
const lastStepRef = useRef<ChrisWizardStep>('session');
```

In `reportAuthSuccess`:

```ts
const reportAuthSuccess = useCallback((mode: ChrisAuthMode) => {
  progressRef.current.authSuccess = true;
  // Goals-first: after auth, user resumes toward payment (wizard sets step).
  lastStepRef.current = 'payment';
  void mode;
}, []);
```

(If `mode` is unused, keep parameter for API stability but do not force `lastStep` to `session`.)

- [ ] **Step 3: Add measurement checklist comment** at top of `chris-campaign-analytics.ts` (after existing file comment):

```ts
/**
 * Measurement checklist (goals-first funnel):
 * 1. Baseline: historical auth-before-session vs post-ship session-before-auth.
 * 2. Signed-out: chris_session_continue before chris_auth_success rate.
 * 3. Paid: chris_checkout_success / chris_booking_page_view and / chris_session_continue.
 * 4. Exit last_step distribution: session | account | payment | stripe.
 * 5. Draft restore: QA only (banner); no BI dashboard.
 * 6. Segment by ref (early-access vs public) when volume allows.
 */
```

- [ ] **Step 4: Run analytics tests**

```bash
npm test -- src/lib/chris-campaign/chris-campaign-analytics.test.ts src/lib/chris-campaign/use-chris-wizard-analytics.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/chris-campaign/use-chris-wizard-analytics.ts \
  src/lib/chris-campaign/chris-campaign-analytics.ts \
  src/lib/chris-campaign/use-chris-wizard-analytics.test.ts \
  src/lib/chris-campaign/chris-campaign-analytics.test.ts
git commit -m "feat(chris): goals-first wizard analytics defaults and checklist"
```

---

### Task 4: Wizard step machine, draft hydrate, banner, CTAs

**Files:**
- Modify: `src/components/chris-campaign/chris-booking-wizard.tsx`

**Interfaces:**
- Consumes: `loadDraft`, `saveDraft`, `clearDraft`, `isChrisDraftSessionComplete`, `BookBodySchema`, draft types
- Produces: goals-first UX behavior per spec §1–§3

This is the largest task. Implement in sub-steps; keep one commit at the end (or split commits if preferred).

- [ ] **Step 1: Imports + hydrate helpers at top of wizard file**

Add imports for draft module and `CHRIS_GOALS_MIN_CHARS`.

- [ ] **Step 2: Replace initial step logic**

Remove:

```ts
const initialStep: WizardStep = session ? 'session' : 'account';
```

Replace with a mount effect pattern:

1. Initialize state fields from props as today.
2. On first client mount (`useEffect` once):
   - `const draft = loadDraft()`
   - If draft has goals/background: set goals/background; set `showRestoreBanner` true if either non-empty
   - Duration: if `prefillDurationMinutes != null` use prefill; else draft.durationMinutes if present
   - scheduledAt/date: if `prefillScheduledAt` / `prefillDate` present, keep props; else apply draft
   - Compute complete = `isChrisDraftSessionComplete({ goals, durationMinutes, scheduledAt })` using state after merge
   - Set step:
     - if `session` && complete → `'payment'`
     - else if !session && complete → `'account'`
     - else → `'session'`
3. Remove the old effect that forced `account → session` when session appears.

- [ ] **Step 3: Post-auth resume**

```ts
useEffect(() => {
  if (!session) return;
  if (step !== 'account') return;
  const draft = loadDraft();
  const complete = isChrisDraftSessionComplete({
    goals: draft?.goals ?? goals,
    durationMinutes: draft?.durationMinutes ?? durationMinutes,
    scheduledAt: draft?.scheduledAt ?? scheduledAt,
  });
  // Prefer live form state if user just filled session
  const liveComplete = isChrisDraftSessionComplete({
    goals,
    durationMinutes,
    scheduledAt,
  });
  const frame = window.requestAnimationFrame(() => {
    setStep(liveComplete || complete ? 'payment' : 'session');
  });
  return () => window.cancelAnimationFrame(frame);
}, [session, step, goals, durationMinutes, scheduledAt]);
```

- [ ] **Step 4: `continueFromSession`**

After successful `BookBodySchema.safeParse`:

```ts
saveDraft({
  goals,
  background,
  durationMinutes,
  scheduledAt,
  date: displayDate,
  marketingReferrer,
});
trackChrisSessionContinue(marketingReferrer);
wizardAnalytics.reportSessionContinue();

if (!session) {
  setStep('account');
  setStepTransitioning(false);
  return;
}
// existing transition to payment...
```

- [ ] **Step 5: Progress component**

Update `ChrisWizardProgress`:

- Signed-out: index 0 session, 1 account, 2 payment (labels optional)
- Signed-in: only two dots — session=0, payment=1

Pass `signedIn: boolean` prop from parent.

- [ ] **Step 6: Account copy**

In auth form submit button:

```ts
mode === 'register' ? 'Create account to lock this session' : 'Sign in to continue'
```

Update subtitle register copy to mention locking the session they already described (not “Introduce yourself to Goals”).

- [ ] **Step 7: Session UI**

- Background label: include “Optional”
- Continue button text: `session ? 'Continue to payment' : 'Continue to create account'`
- Keep `data-testid="booking-wizard-continue-session"`

- [ ] **Step 8: Restore banner**

When `showRestoreBanner && step === 'session'`:

```tsx
<div
  data-testid="chris-draft-restore-banner"
  className="mb-md rounded-lg border border-white/15 bg-white/5 px-md py-sm text-sm text-white/90"
  role="status"
>
  <p>Continue where you left off</p>
  <div className="mt-xs flex gap-sm">
    <button type="button" onClick={() => setShowRestoreBanner(false)}>
      Dismiss
    </button>
    <button
      type="button"
      data-testid="chris-draft-start-over"
      onClick={() => {
        clearDraft();
        setGoals('');
        setBackground('');
        setShowRestoreBanner(false);
        setStep('session');
      }}
    >
      Start over
    </button>
  </div>
</div>
```

- [ ] **Step 9: Payment edit + clear draft**

On payment summary, add:

```tsx
<button type="button" data-testid="chris-edit-session" onClick={() => setStep('session')}>
  Edit goals or length
</button>
```

When fulfillment reaches next_steps (existing success effect), call `clearDraft()`.

- [ ] **Step 10: Manual unit smoke** (no component test harness required if none exists)

```bash
npm test -- src/lib/chris-campaign/chris-booking-draft.test.ts src/lib/book-request-schema.test.ts
```

- [ ] **Step 11: Commit**

```bash
git add src/components/chris-campaign/chris-booking-wizard.tsx
git commit -m "feat(chris): goals-first wizard order, draft restore, and payment resume"
```

---

### Task 5: Landing live price, partial draft, DurationStepper CSS

**Files:**
- Modify: `src/components/chris-campaign/chris-request-session-form.tsx`
- Modify: `src/components/chris-campaign/chris-mobile-booking-card.tsx` (if it has independent duration + CTA)
- Modify: `src/components/chris-campaign/chris-landing.css`

**Interfaces:**
- Consumes: `resolveChrisChargeCents`, `resolveChrisOriginalPriceCents`, `resolveChrisPricingTier`, `saveDraft`
- Produces: visible price next to duration; draft partial on Request Session

- [ ] **Step 1: Price line helper (inline in form is fine)**

```tsx
import {
  resolveChrisChargeCents,
  resolveChrisOriginalPriceCents,
  resolveChrisPricingTier,
} from '@/lib/chris-campaign/chris-pricing';
import { saveDraft } from '@/lib/chris-campaign/chris-booking-draft';

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

// inside component:
const chargeCents = resolveChrisChargeCents(marketingReferrer, durationMinutes);
const originalCents = resolveChrisOriginalPriceCents(durationMinutes);
const isEarly = resolveChrisPricingTier(marketingReferrer) === 'early_access';
```

Render under DurationStepper (mobile + desktop branches):

```tsx
<p
  data-testid="chris-landing-price"
  className="text-sm font-medium text-white/90"
  aria-live="polite"
>
  {isEarly && originalCents > chargeCents ? (
    <>
      <span className="mr-2 text-white/50 line-through">{formatMoney(originalCents)}</span>
      <span>
        {formatMoney(chargeCents)} early access · {durationMinutes} min
      </span>
    </>
  ) : (
    <span>
      {formatMoney(chargeCents)} · {durationMinutes} min
    </span>
  )}
</p>
```

- [ ] **Step 2: Partial draft in `handleBook`**

Before `router.push`:

```ts
const date = dateSelection.activeDate ?? null;
const scheduledAt = date ? `${date}T12:00` : '';
saveDraft({
  durationMinutes,
  date,
  scheduledAt,
  marketingReferrer,
});
```

- [ ] **Step 3: Mirror on `chris-mobile-booking-card.tsx`** if it duplicates duration + navigation (same price test id or `chris-landing-price-mobile`).

- [ ] **Step 4: CSS for DurationStepper on dark Chris UI**

In `chris-landing.css` add overrides scoped to campaign roots (use existing parent class on landing/wizard if present; else wrap):

```css
/* DurationStepper contrast on Chris dark surfaces */
.chris-landing .experts-duration__label,
.chris-booking-wizard .experts-duration__label,
[data-testid='booking-chris-campaign'] .experts-duration__label {
  color: rgba(255, 255, 255, 0.75);
}

.chris-landing .experts-duration__mins,
.chris-booking-wizard .experts-duration__mins,
[data-testid='booking-chris-campaign'] .experts-duration__mins {
  color: #fff;
}

.chris-landing .experts-duration__step-btn,
.chris-booking-wizard .experts-duration__step-btn,
[data-testid='booking-chris-campaign'] .experts-duration__step-btn {
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.chris-landing .experts-duration__hint,
[data-testid='booking-chris-campaign'] .experts-duration__hint {
  color: rgba(255, 255, 255, 0.45);
}

.chris-landing .experts-duration__segs span.is-empty {
  background: rgba(255, 255, 255, 0.12);
}
```

Ensure wizard root has `data-testid="booking-chris-campaign"` (already does) so selectors apply.

- [ ] **Step 5: Commit**

```bash
git add src/components/chris-campaign/chris-request-session-form.tsx \
  src/components/chris-campaign/chris-mobile-booking-card.tsx \
  src/components/chris-campaign/chris-landing.css
git commit -m "feat(chris): landing live price and draft handoff with stepper contrast"
```

---

### Task 6: De-hardcode “45-Minute” product copy (E3)

**Files:**
- Modify: `src/components/chris-campaign/chris-landing-client.tsx`
- Modify: `src/components/chris-campaign/chris-mobile-landing.tsx`
- Modify: `src/components/chris-campaign/chris-slot-picker.tsx` (UI strings only)
- Do **not** change email templates or `chris-campaign-social-meta.ts`

- [ ] **Step 1: Hero H1**

Replace:

`Private 45-Minute Session with Astronaut Chris Sembroski`

With:

`Private 1:1 session with Astronaut Chris Sembroski`

in both landing files.

- [ ] **Step 2: Body blurb**

In desktop landing, replace fixed “full guaranteed 45 minutes” with copy like:

`You get your full booked session time with Chris — not a rushed hallway chat.`

- [ ] **Step 3: Slot picker product strings**

Replace user-visible “45-minute” / “45-Minute” with “session” or dynamic duration where the component has duration in scope; if not, use “live 1:1” / “session time”.

- [ ] **Step 4: Wizard** already uses `{durationMinutes}-minute live 1:1` — leave as dynamic.

- [ ] **Step 5: Commit**

```bash
git add src/components/chris-campaign/chris-landing-client.tsx \
  src/components/chris-campaign/chris-mobile-landing.tsx \
  src/components/chris-campaign/chris-slot-picker.tsx
git commit -m "fix(chris): stop hardcoding 45-minute-only marketing copy on product UI"
```

---

### Task 7: E2E goals-first funnel

**Files:**
- Modify: `e2e/talk-with-chris.spec.ts`

**Interfaces:**
- Consumes: test ids from wizard/landing (`chris-landing-price`, `booking-wizard-continue-session`, `chris-draft-restore-banner`, etc.)

- [ ] **Step 1: Ensure E2E goals strings are ≥ 50 characters**

Update `E2E_GOALS` if needed:

```ts
const E2E_GOALS = `${E2E_GOALS_TAG} Inspiration4 outreach strategy for STEM nonprofit launch plan`;
```

- [ ] **Step 2: Fix existing happy path for signed-in flow**

Current spec fills goals then continue → submit. Ensure:

1. After landing CTA, if signed out, wizard starts on **session** (not account). E2E may use demo session — check whether `talk-with-chris` booking tests assume signed-in via global setup.

Read how auth is established in this file / project E2E config. If already signed in as mentee:

- Expect **no** “Create your account” heading first
- Session first → continue → payment submit

If signed out:

- Session → continue → account → (cannot easily pay without auth) — use `POST /api/e2e/session` before payment if other specs do.

Follow existing patterns in `e2e/` for establishing mentee session.

- [ ] **Step 3: Assert landing price**

```ts
await expect(page.getByTestId('chris-landing-price').first()).toBeVisible();
```

- [ ] **Step 4: Optional background empty continues** (signed-in path)

```ts
await page.getByTestId('booking-goals').fill(E2E_GOALS);
await page.getByTestId('booking-background').fill('');
await page.getByTestId('booking-wizard-continue-session').click();
await expect(page.getByTestId('booking-submit')).toBeVisible();
```

- [ ] **Step 5: Short goals blocked**

```ts
await page.getByTestId('booking-goals').fill('too short');
await page.getByTestId('booking-wizard-continue-session').click();
await expect(page.getByTestId('booking-submit')).toHaveCount(0);
```

- [ ] **Step 6: Draft restore (optional dedicated test)**

```ts
test('restores Chris booking draft after reload', async ({ page }) => {
  await page.goto('/talk-with-chris', { waitUntil: 'networkidle' });
  await page.getByTestId('chris-landing-row').getByTestId('chris-request-session').click();
  await page.getByTestId('booking-goals').fill(E2E_GOALS);
  await page.getByTestId('booking-wizard-continue-session').click();
  // If signed out, may be on account — either way draft saved
  await page.reload({ waitUntil: 'networkidle' });
  // Re-enter booking if needed, or stay on /booking
  await expect(page.getByTestId('chris-draft-restore-banner')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('booking-goals')).toHaveValue(new RegExp(E2E_GOALS_TAG));
});
```

Adjust if signed-in complete draft skips to payment (banner only on session — then use incomplete goals or click Edit).

- [ ] **Step 7: Update brittle assertion**

Replace:

```ts
await expect(page.getByText(/45-minute live 1:1/i)).toBeVisible();
```

With duration-flexible:

```ts
await expect(page.getByText(/\d+-minute live 1:1/i)).toBeVisible();
```

- [ ] **Step 8: Run E2E**

```bash
npm run test:e2e -- e2e/talk-with-chris.spec.ts
```

Expected: PASS (or fix failures until green)

- [ ] **Step 9: Commit**

```bash
git add e2e/talk-with-chris.spec.ts
git commit -m "test(e2e): cover Chris goals-first funnel, draft, and hybrid goals"
```

---

### Task 8: Final verification sweep

**Files:** none new — run commands only

- [ ] **Step 1: Unit suite for touched areas**

```bash
npm test -- src/lib/chris-campaign/chris-booking-draft.test.ts \
  src/lib/book-request-schema.test.ts \
  src/lib/chris-campaign/chris-campaign-analytics.test.ts \
  src/lib/chris-campaign/use-chris-wizard-analytics.test.ts \
  src/lib/chris-campaign/chris-pricing.test.ts
```

Expected: all PASS

- [ ] **Step 2: Lint touched files (optional if noisy repo)**

```bash
npx eslint src/lib/chris-campaign/chris-booking-draft.ts \
  src/lib/book-request-schema.ts \
  src/components/chris-campaign/chris-booking-wizard.tsx \
  src/components/chris-campaign/chris-request-session-form.tsx
```

- [ ] **Step 3: Manual checklist (document in commit message or leave for human)**

- [ ] Dark landing: DurationStepper readable  
- [ ] Price updates when stepping duration  
- [ ] Signed-out: session → account → (auth) → payment  
- [ ] Signed-in complete draft remount → payment  
- [ ] Edit goals from payment preserves draft  
- [ ] Pay success clears draft  

- [ ] **Step 4: Final commit only if cleanup** — otherwise done.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| session → account → payment order | 4 |
| Signed-in skips account | 4 |
| Mount resume matrix (payment / account / session) | 4 |
| localStorage draft 48h | 1, 4, 5 |
| Restore banner + Start over | 4 |
| Goals min 50 Chris; background optional | 2, 4, 7 |
| Non-Chris mins unchanged | 2 |
| Straight to payment after auth | 4 |
| Edit from payment | 4 |
| Clear draft on success | 4 |
| Landing live price | 5 |
| DurationStepper CSS on Chris | 5 |
| Partial draft on Request Session | 5 |
| De-hardcode 45-minute product copy | 6 |
| Analytics default session + checklist | 3 |
| E2E coverage | 7 |
| No email / OG / E5 | (non-goals — not scheduled) |

## Self-review notes

- No TBD placeholders in tasks.
- Draft API names consistent: `loadDraft` / `saveDraft` / `clearDraft` / `isChrisDraftSessionComplete`.
- `CHRIS_GOALS_MIN_CHARS = 50` single source in constants.
- Wizard is one large task by necessity; draft + schema ship first so wizard can depend on them.
- E2E must respect real auth setup in this repo — implementer should follow existing mentee session helpers rather than inventing auth.
