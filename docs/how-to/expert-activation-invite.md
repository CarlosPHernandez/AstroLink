# How to: invite an expert to activate their account

Use this for pre-seeded experts (Chris Sembroski, demo activation expert, etc.). They claim the **existing** mentor row; slug and bookings stay the same.

## Prerequisites

1. Apply migrations including `20260721120000_mentor_activation_claim.sql` (and optional demo seed).
2. Production Supabase Auth on (`ENABLE_DEMO_AUTH=false`).
3. Resend configured (`RESEND_API_KEY`, from address).
4. Admin session (ops) on the admin dashboard.

## Dry-run (before Chris)

1. Confirm demo expert exists: slug `demo-activation-expert`, email `demo-activation@astrolink.ai`, `activation_status=pending`.
2. Admin → **Create / update expert** list → enter a **real inbox you control** → **Invite to activate**.
3. Open email → **Continue** → complete magic-link sign-in → wizard (profile + optional payout) → dashboard.
4. Log out/in: should land on mentor dashboard, not wizard.

## Invite Chris (production)

1. Keep public listing live (`is_listed=true`, slug `chris-sembroski`).
2. Admin invite to Chris’s real email (ops secret). Do not share the placeholder `chris@astrolink.ai` as login.
3. He completes the same path alone.
4. Confirm bookings still appear under the same mentor id; public URL `/experts/chris-sembroski` unchanged.

## Revoke

`DELETE /api/admin/mentors/:id/invite` expires tokens and clears `pending_email` for pending mentors.

## Notes

- Wizard does **not** expose listing/slug (admin-owned).
- Payout preference is for **manual** bank/PayPal/Zelle/Cash App ops — not Stripe Connect.
- Mentor role is granted only when `mentors.user_id` is linked (after claim). Email alone does **not** attach a pending expert profile.
- Claim tokens are single-use and consumed before the mentor row is updated; re-invite if a mid-link failure occurs.
- Dashboard mutations require `activation_status = active` (`requireActivatedMentor`).
