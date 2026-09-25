# Mint a guest invite for a free Chris session

One link, one email, one 25-minute call at $0. Do not send the link until you know the email he will use to sign up.

## Mint

From the repo, with `.env.local` pointing at the target Supabase project:

```bash
node --env-file=.env.local scripts/mint-guest-invite.mjs --email him@example.com --note "lockheed thread"
```

The command prints the invite id, the expiry (14 days unless you pass `--days`), and the URL. Copy the URL into the DM. It is not stored. The database keeps a hash.

## What he does

He opens the link, creates an account with that same email, confirms the email if asked, and books a time. The page does not promise a job or an introduction. If the time overlaps another live session with Chris, he has to pick another slot.

## Revoke

```bash
node --env-file=.env.local scripts/mint-guest-invite.mjs --revoke <invite-uuid>
```

This works while the invite is still available or claimed and has not been redeemed.

## Waitlist kill switch

`/invite` and `POST /api/guest-invites/claim` stay open if `APP_MODE=waitlist`. Sign-in and `/booking` still redirect in that mode, so he can read the page but cannot finish the booking until the full app is on.

Apply migration `20260924120000_guest_session_invites.sql` before minting.
