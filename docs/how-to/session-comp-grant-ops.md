# Ops: grant a complimentary 15-minute session

Use this for **one-off goodwill** (e.g. quality issue). Not a multi-balance wallet.

## Prerequisites

1. Migration `session_comp_grants` applied on the target Supabase project.
2. Customer has a `public.users` row and can sign in as a **mentee**.

## Resolve the correct user id

```sql
SELECT id, email, full_name
FROM public.users
WHERE lower(email) = lower('customer@example.com');
```

Confirm with a past booking if needed:

```sql
SELECT id, mentee_id, mentor_id, status, scheduled_at
FROM public.bookings
WHERE mentee_id = '<user-uuid>'
ORDER BY scheduled_at DESC
LIMIT 5;
```

**Use `public.users.id`** (same as `bookings.mentee_id` / mentee session), not Auth UUID unless they match.

## Insert grant (one available per user)

```sql
INSERT INTO public.session_comp_grants (
  user_id,
  credit_minutes,
  eligible_scope,
  status,
  expires_at,
  internal_note,
  created_by,
  source_booking_id
) VALUES (
  '<user-uuid>',
  15,
  'any_listed_expert',
  'available',
  now() + interval '90 days',
  'Goodwill: describe reason + source booking if any',
  'ops_sql',
  NULL  -- or source booking uuid
);
```

Only **one** row with `status = 'available'` per user (unique index).

## What the customer sees

- Banner on **mentee dashboard**
- Banner + **Apply complimentary session** checkbox on **booking** when duration is **15 minutes**
- Checkout becomes **$0** (existing free-session path; no Stripe PaymentIntent)

## Redeem rules (server)

- Exactly **15 minutes**, live 1:1 only
- Grant must be `available` and not expired
- Redeemed only after booking is confirmed free
- Longer sessions: full price; grant stays available until used on a 15-min book

## Verify

```sql
SELECT id, status, expires_at, redeemed_at, redeemed_booking_id, internal_note
FROM public.session_comp_grants
WHERE user_id = '<user-uuid>';
```

## Revoke unused grant

```sql
UPDATE public.session_comp_grants
SET status = 'revoked'
WHERE user_id = '<user-uuid>' AND status = 'available';
```
