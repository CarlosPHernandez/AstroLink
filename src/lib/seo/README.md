# SEO module (`src/lib/seo`)

Crawl infrastructure and metadata for public AstroLink pages. **PR1** serves static/cached metadata from mentor data. **PR2** will add APX-07 approved snapshots.

## Canonical rules

- **Host:** always `https://astro-link.space` in production metadata (see `getProductionAppUrl()`).
- **Join pages:** `/join/[slug]` canonical → `/experts/[slug]` (ranking consolidates on the directory URL).
- **Query strings:** never in canonicals (`?ref=` is for DB attribution only).
- **Preview deploys:** `robots.ts` disallows all when `VERCEL_ENV !== 'production'`.

## Module map

| File | Role |
|------|------|
| `copy.ts` | Titles, descriptions, XPRIZE mention (site-level only) |
| `types.ts` | `SeoPageType`, builder input types |
| `build-page-metadata.ts` | Returns Next.js `Metadata` per page type |
| `json-ld.ts` | schema.org `Person`, `VideoObject`, `WebSite` helpers |

Related:

| File | Role |
|------|------|
| `src/lib/expert-cta.ts` | Waitlist vs booking CTA hrefs |
| `src/app/robots.ts` | Crawler rules |
| `src/app/sitemap.ts` | Dynamic sitemap from `listPublicMentors()` |
| `src/components/seo/seo-json-ld.tsx` | Renders JSON-LD script tag |

## Adding a new public page

1. Add a `SeoPageType` variant in `types.ts`.
2. Implement a branch in `buildPageMetadata()`.
3. Export `metadata` or `generateMetadata` from the route using the builder.
4. Add the URL to `sitemap.ts` if indexable.
5. Add unit tests in `build-page-metadata.test.ts`.

## Waitlist vs full mode

Expert CTAs use `resolveExpertCta(slug, isSignedIn, waitlistMode)`:

- **Waitlist:** `/early-access?ref=expert-<slug>` — label “Get early access”
- **Full:** existing booking/auth flow via `getExpertBookHref()`

Compute `waitlistMode` server-side (`isWaitlistMode()`) and pass into client components.

## Claim boundary (PR2 agent + Marketing review)

- Employer names (NASA, SpaceX, etc.) only when **factually true** in mentor DB fields.
- Never imply affiliation, endorsement, or partnership with employers or XPRIZE/Google.
- **XPRIZE:** `withXprizeMention()` applies to `/early-access` only — not expert profiles.

## APX-07 workflow (PR2 — not yet implemented)

```
Mentor updated → SeoAgent draft → pending_review → Marketing approves → live → revalidate
```

Fallback: PR1 metadata from mentor bio when no live snapshot exists.

## Testing

```bash
npm test -- src/lib/seo src/lib/expert-cta src/lib/waitlist/waitlist-routes
npm run test:e2e -- e2e/seo-public-experts.spec.ts
```

## Ops checklist

- [ ] Google Search Console verified for `astro-link.space`
- [ ] Sitemap submitted: `https://astro-link.space/sitemap.xml`
- [ ] Weekly: impressions, indexed pages, organic waitlist signups