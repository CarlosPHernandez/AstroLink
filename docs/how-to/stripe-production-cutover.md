# Stripe Production Cutover (Sandbox → Live)

This guide explains how to move from the AstroLink Stripe **sandbox** (used for local dev and Vercel preview) to **production** on the shared Helios Nexus, Inc. account.

## Sandbox vs Production

- **Sandbox (AstroLink sandbox)**: Isolated test environment created specifically for this app.
  - Use `sk_test_...` / `pk_test_...` from the AstroLink sandbox.
  - Local development: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (the `whsec_` it prints goes into `STRIPE_WEBHOOK_SECRET`).
  - Vercel Preview: register a webhook endpoint inside the AstroLink sandbox (Test mode) pointing at your preview URL, or rely on the sandbox test keys + registered test webhook.
  - All data (customers, PaymentIntents, webhooks) is isolated from other apps sharing the account.

- **Production (Live mode on the same account)**: Real money, real customers.
  - You stay on the **Helios Nexus, Inc.** account but switch the account picker to **Live**.
  - Use a **Restricted API Key (RAK)** (`rk_live_...`) as `STRIPE_SECRET_KEY` (never a full secret key in production).
  - Use the **live** publishable key (`pk_live_...`) for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
  - Register the webhook endpoint in **Live** mode.
  - Put these values **only** in Vercel **Production** environment variables.
  - `SKIP_STRIPE_PAYMENTS` must be absent (it is hard-disabled in production builds anyway).

The `metadata.app = 'astrolink'` we set on every PaymentIntent + the defensive filter in the webhook handler protect the shared account.

## Step-by-Step Production Setup

### 1. Create the Production Restricted API Key (RAK)

1. Log into the Stripe Dashboard for Helios Nexus, Inc.
2. In the top-left account picker, ensure you are in **Live** mode (not Test / not the AstroLink sandbox).
3. Go to **Developers** → **API keys** → **Restricted keys** tab.
4. Click **Create restricted key**.
5. Name it clearly, e.g. `AstroLink Production Server`.
6. Grant the **minimum** permissions required for our immediate-capture flow:
   - **Core resources**
     - PaymentIntents: **Write**
     - Customers: **Write**
     - Refunds: **Write**
     - Charges: **Write** (helpful for reconciliation)
   - **Webhook Endpoints**: **Read**
   - (Optional, for future) Billing Portal: **Write**
   - **Everything else** (especially anything under Connect, Transfers, Payouts, Accounts, etc.): **None**

7. Create the key and copy the `rk_live_...` value immediately (it is only shown once).

This RAK becomes your production `STRIPE_SECRET_KEY`.

Also copy the live publishable key (`pk_live_...`) shown on the same page.

### 2. Register the Live Webhook Endpoint

Still in **Live** mode:

1. Go to **Developers** → **Webhooks**.
2. Click **Add endpoint**.
3. Endpoint URL: your production domain, e.g.
   `https://astralink.ai/api/webhooks/stripe`
   (or the exact Vercel production domain you use).
4. **Select events** (exactly these four — no more):
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
5. Add the endpoint.
6. Copy the **Signing secret** (`whsec_...`). This becomes your production `STRIPE_WEBHOOK_SECRET`.

**Important**: This webhook is completely separate from any webhook you registered inside the AstroLink sandbox.

### 3. Configure Vercel Production Environment Variables

In Vercel, for the **Production** environment (not Preview):

```env
STRIPE_SECRET_KEY=rk_live_...                    # the RAK you just created
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...                  # from the Live webhook
```

- Do **not** set `SKIP_STRIPE_PAYMENTS`.
- `APP_MODE=full` (or whatever your production value is).
- Deploy.

Preview environments should continue to use the **sandbox** test keys + the sandbox webhook (or `stripe listen` for local).

### 4. Verify End-to-End with Real Money (Small Amount)

1. Deploy the production build.
2. As a real mentee (or use a low-value test with a real card you control), book a cheap session.
3. Complete payment with a real card.
4. Confirm:
   - The booking appears with status `confirmed`.
   - The AI briefing was generated.
   - `daily_room_url` was provisioned.
   - You can reach the session room (within the join window).
5. After the call (or immediately for a tiny test), cancel via the UI (or use the mentee cancel API) and verify a refund was created.
6. Check the Stripe Dashboard (Live) for the PaymentIntent, charge, and refund.
7. Check your Supabase `audit_log`, `transactions`, and `bookings` tables.

Monitor the first few real bookings for webhook delivery, status transitions, and room provisioning.

### 5. Operational Notes

- **Monitoring**: Watch for webhook failures (`4xx`/`5xx` responses in Stripe → Developers → Webhooks) and any `pending_payment` bookings that stay stuck > a few minutes.
- **Secrets rotation**: Rotate the RAK and webhook secret the same way you would any other production secret.
- **Connect / payouts**: Still deferred (platform-only). Mentors are paid manually.
- **Test data hygiene**: Use the AstroLink sandbox for all ongoing development and QA. Never mix live and test data.
- **Rollback**: If something goes wrong, you can temporarily set a feature flag or revert the production deploy; the RAK can be revoked instantly in the Dashboard.

## Quick Reference

| Environment     | Stripe Mode       | Secret Key Type          | Webhook Location          | Where the keys live                  |
|-----------------|-------------------|--------------------------|---------------------------|--------------------------------------|
| Local dev       | AstroLink sandbox | `sk_test_`               | `stripe listen` (CLI)     | `.env.local`                         |
| Vercel Preview  | AstroLink sandbox | `sk_test_` / `pk_test_`  | Sandbox webhook or listen | Vercel Preview env vars              |
| Production      | Live (same acct)  | `rk_live_` (RAK)         | Live webhook (Dashboard)  | Vercel Production env vars only      |

## Related Docs

- [Production readiness notes in the engineering plan](../plan file in .grok/sessions if present)
- AGENTS.md (environment + "hard-disabled in production" guards)
- `.env.example` (comments on the Stripe variables)

After the first successful real transaction + refund, update this document with any lessons learned.