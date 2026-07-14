# Marketing referrer taxonomy (early access)

Early-access signups store a single `referrer` string on `early_access_signups.referrer`. Marketing and sales links must use the **`ref` query parameter** so Carlos’s canvases and the admin dashboard can attribute signups.

## URL format

```
https://<your-host>/early-access?ref=<referrer-id>
```

Examples:

- `https://astro-link-sooty.vercel.app/early-access?ref=linkedin-jun-2026`
- `https://astro-link-sooty.vercel.app/early-access?ref=partner-nasa-stem`
- `https://astro-link.space/early-access?ref=partner-inspired24` (use the production canonical from `getAppBaseUrl()` / `astro-link.space`. A www variant is acceptable for user-facing links if your domain redirects it.)

Do **not** rely on raw query strings (`?utm_source=...` alone). If you use UTM parameters for analytics, still set `ref` to the canonical AstroLink id below.

## Allowed `ref` values

Use **kebab-case**, stable for the life of a campaign (do not change mid-flight).

Use the same host as your production canonical (`getAppBaseUrl()` → `https://astro-link.space`).

| `ref` | Owner | Use when |
|-------|-------|----------|
| `linkedin-jun-2026` | Zen | LinkedIn posts / profile link |
| `space-newsletter-04` | Zen | Owned email newsletter issue |
| `twitter-x-2026` | Zen | X / Twitter bio or posts |
| `conference-<event-slug>` | Oliver | Event booth, talk QR, partner table |
| `partner-<org-slug>` | Oliver | Co-marketing with a named org (add a concrete row per partner when live) |
| `partner-inspired24` | Inspired24 | Member email — early access closing notice (locked; do not rename mid-campaign) |
| `outbound-<prospect-slug>` | Oliver | One-off link in a sales email (optional) |
| `chris-sembroski` | Chris campaign | Public Chris promotion — `/talk-with-chris?ref=chris-sembroski` (full $200; no limited-slot scarcity UI) |
| `chris-social` | Chris social | Chris Instagram/X/etc. — `/talk-with-chris?ref=chris-social` (full **$200**; hide spots remaining) |
| `early-signups` | Waitlist email | Chris waitlist email — early-access **$180** + show limited slots; CTA may use `/talk-with-chris?ref=early-signups` |
| `expert-david-guajardo` | David / Carlos | David’s partner landing `/join/david-guajardo` (auto-set; do not hand-edit links) |
| `expert-<mentor-slug>` | Expert roster | Other `/join/<slug>` partner pages (e.g. `expert-chris-sembroski`) |
| `direct` | — | Reserved; omit `ref` for organic (stored as `(direct)` in reports) |

Add new rows to this table before publishing links. Carlos refreshes canvases from the same strings.

## Zen checklist

1. Pick a `ref` from the table (or add one here first).
2. Every CTA uses `/early-access?ref=...`.
3. After a campaign ends, keep the `ref` for historical charts; start a new id for the next wave.

## Oliver checklist

1. Use `conference-*` or `partner-*` for events and intros.
2. Ask Carlos for a “signups from `ref`” screenshot before follow-up calls.

## Technical note

The client reads `ref` via [`parseEarlyAccessReferrer`](../../src/lib/waitlist/early-access-referrer.ts) and POSTs it to [`/api/early-access`](../../src/app/api/early-access/route.ts).
