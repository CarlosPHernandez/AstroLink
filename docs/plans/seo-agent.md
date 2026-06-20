# SEO Agent — Implementation Plan

**Branch:** `feat/seo-agent`  
**Status:** PR1 shipped (v0.4.5.0) — PR2 pending  
**Official domain:** `https://astro-link.space`  
**Eng review:** 2026-06-20 (two-phase delivery accepted)

## Problem

AstroLink’s expert inventory is the product, but search engines cannot reliably discover or rank public expert pages. Waitlist mode blocks `/experts`, canonicals are inconsistent, and there is no sitemap. Metadata is raw bio truncation — not tuned for search or sharing.

## Success metrics

1. **Search impressions** (Google Search Console, weekly)
2. **Waitlist signups from organic** (correlate GSC landing pages with `early_access_signups`)
3. **Indexed page count** (Search Console → Pages)

## Locked decisions

| Topic | Decision |
|-------|----------|
| Waitlist mode | Public `/experts` + `/experts/[slug]` before booking opens |
| Canonical host | Always `https://astro-link.space` |
| `/join/[slug]` canonical | Points to `/experts/[slug]` |
| SEO approval (PR2) | Marketing approves; Carlos can override |
| Employer names | Factual only (NASA, SpaceX) — no affiliation/partnership language |
| XPRIZE copy | Site-level pages only (`/early-access`); never per-expert metadata |
| Delivery | PR1 foundation → PR2 APX-07 agent |

## PR1 — SEO Foundation (current)

### Checklist

- [x] `src/lib/waitlist/waitlist-routes.ts` — allow `/experts/*` in waitlist mode
- [x] `src/lib/expert-cta.ts` — waitlist-safe CTAs
- [x] `src/lib/seo/` — metadata builder, JSON-LD, copy constants
- [x] `src/app/robots.ts` + `src/app/sitemap.ts`
- [x] `metadataBase` in root layout
- [x] Wire `generateMetadata` on public routes
- [x] JSON-LD on expert profiles
- [x] Unit + E2E tests
- [ ] Submit sitemap in Google Search Console (manual ops)

### Files

| Action | Path |
|--------|------|
| NEW | `src/lib/seo/copy.ts`, `types.ts`, `build-page-metadata.ts`, `json-ld.ts`, `README.md` |
| NEW | `src/lib/expert-cta.ts` |
| NEW | `src/app/robots.ts`, `sitemap.ts` |
| NEW | `src/components/seo/seo-json-ld.tsx` |
| NEW | `e2e/seo-public-experts.spec.ts` |
| MODIFY | `waitlist-routes.ts`, expert pages, `layout.tsx`, `early-access-social-meta.ts` |

### Manual ops (PR1 done)

1. Verify Search Console property for `astro-link.space`
2. Submit `https://astro-link.space/sitemap.xml`
3. Request indexing for `/experts` and top expert profiles

## PR2 — APX-07 SEO Agent (deferred)

- `seo_snapshots` migration
- `src/services/agents/seo-agent.ts` (APX-07)
- Admin approval UI for Marketing
- Live snapshots wired into `build-page-metadata.ts`

See `src/lib/seo/README.md` for module documentation.

## NOT in scope

- Category hub pages (`/experts/category/*`) — PR3
- Search Console API automation
- Organic `ref` auto-tagging — PR3
- Per-request LLM in `generateMetadata()`
- Blog / content marketing pages

## Decision ledger

| # | Item | Status |
|---|------|--------|
| 1 | Two-phase delivery | Accepted |
| 2 | Public experts in waitlist | Accepted |
| 3 | XPRIZE on site-level SEO only | Accepted |
| 4 | Marketing auth = admin accounts at launch | Recommended (PR2) |
| 5 | Category pages + organic ref | Deferred PR3 |