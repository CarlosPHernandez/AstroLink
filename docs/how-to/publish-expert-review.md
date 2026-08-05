# Publish an expert review (manual / Jotform)

Post-session mentee submit + admin moderation UI ship with this feature
(`/dashboard/admin/expert-reviews`, `POST /api/expert-reviews`).
Mentee submit is **never blocked by LLM soft denials** — APX-09 screens in the
background. Clear + consented reviews may auto-publish; flagged ones stay pending
for admins (mentors see private feedback on their dashboard).

Jotform and pure SQL remain supported for launch ops without a mentee account.

For manual / Jotform: Ops inserts rows in Supabase after consent is clear.

## Prerequisites

1. Apply migration `20260730120000_expert_reviews.sql` on the target project.
2. Confirm the customer agreed the quote may appear on AstroLink public pages (Jotform checkbox or email).
3. Redact PII from the quote if needed (names, schools, employers) unless they consented to that attribution.

## Field mapping (Jotform → table)

| Jotform / source | Column | Notes |
|------------------|--------|--------|
| Star rating | `rating` | 1–5 integer |
| Testimonial text | `quote` | 20–600 chars; fix typos only |
| Name / school on form | **not** copied raw | Set safe `display_name` + `attribution_type` |
| Publish OK? | `consent_to_publish` | Must be true before public show |
| Form / submission id | `consent_notes` | Internal only |
| — | `source` | Use `'jotform'` for form-sourced reviews |

Safe `display_name` examples:

- `Verified Astro-Link user` (`attribution_type = 'anonymous'`)
- `STEM student` (`role_only`)
- `ACC student, shared with permission` (`organization` — only with school consent)

## Resolve Chris’s mentor id

```sql
SELECT id, full_name, slug
FROM public.mentors
WHERE slug = 'chris-sembroski';
```

Do not assume the local seed UUID is production.

## Insert (pending first)

```sql
INSERT INTO public.expert_reviews (
  expert_id,
  booking_id,          -- optional; enables "Verified Astro-Link session"
  reviewer_user_id,    -- optional; leave null if anonymized
  rating,
  quote,
  display_name,
  attribution_type,
  consent_to_publish,
  status,
  source,
  consent_notes,
  approved_at,
  approved_by
) VALUES (
  '<expert-uuid>',
  NULL,
  NULL,
  5,
  '<exact quote from Jotform, redacted if needed>',
  'Verified Astro-Link user',
  'anonymous',
  false,
  'pending',
  'jotform',
  'Jotform submission <id>; consent via form field <…>',
  NULL,
  NULL
);
```

## Approve for public display

```sql
UPDATE public.expert_reviews
SET
  consent_to_publish = true,
  status = 'approved',
  approved_at = now(),
  approved_by = 'ops@yourdomain'
WHERE id = '<review-uuid>';
```

Public surfaces only show rows with **both** `status = 'approved'` **and** `consent_to_publish = true` (query + RLS).

## Hide / withdraw

```sql
UPDATE public.expert_reviews
SET status = 'withdrawn'  -- or 'hidden'
WHERE id = '<review-uuid>';
```

## Cache

Profile pages cache reviews ~300s (`unstable_cache` tags `expert-reviews` / `expert-reviews-<expertId>`).
Admin approve / hide / withdraw calls `revalidateExpertReviews(expertId)` automatically.
After pure SQL approve/hide: wait for TTL or redeploy.

## Verify

1. Open `/experts/chris-sembroski` (signed out).
2. Confirm the **Session feedback** block: stars, quote, attribution, footnote.
3. Confirm no full name/school appears unless consented.
4. Confirm another expert without reviews has **no** empty reviews section.
