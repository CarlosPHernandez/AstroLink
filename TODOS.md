# TODOS

## Booking

### Reject overlapping times on every Chris booking

**What:** The guest invite refuses a slot that overlaps another live Chris booking. Paid Chris bookings still do not.

**Why:** Nothing in `booking-agent` or the migrations blocks two sessions in the same window.

**Context:** Found in the guest-invite eng review (2026-09-24). The invite path grows the check in `assertChrisWindowFree`. The follow-up is to use it for every `campaign=chris` book.

**Effort:** S
**Priority:** P2
**Depends on:** guest invite overlap helper

### Stop sending private token URLs to Meta

**What:** `/r/chris-slot?t=…` still loads `MetaPixel` from the root layout, so `PageView` can send that token to Meta. `/invite` is exempt.

**Why:** Same leak closed for the gift link.

**Context:** `src/components/meta-pixel.tsx` fires `fbq('track', 'PageView')` on every page. Root layout mounts it.

**Effort:** S
**Priority:** P3
**Depends on:** None

## Landing / Experts

### Verify Spanish-language expert bios still get a `lang="es"` attribute

**What:** The pre-redesign profile page had `<div lang="es">` wrapping bio text for language labeling; the 2026-08-10 light re-theme of `expert-profile-client.tsx` dropped it with no conditional logic reinstated.

**Why:** If any live mentor bio in Supabase is actually written in Spanish, screen readers will now mispronounce it — a silent accessibility regression. If no bios are Spanish, the removal was correct (the old attribute was hardcoded and mislabeling English bios).

**Context:** Surfaced by the `/ship` adversarial review on 2026-08-10. Needs a quick check against real bio content in Supabase (`mentors` table), then either restore the attribute conditionally or confirm no action is needed.

**Effort:** S
**Priority:** P2
**Depends on:** None

### Remove or repurpose the orphaned landing goal-relay pipeline

**What:** `/api/landing/relay-preview`, `src/lib/landing/hero-relay.ts`, `hero-relay-llm.ts`, `sanitize-teaser.ts`, `path-chips.ts`, `landing-hero-headline.tsx`, `use-landing-hero-chat.ts`, `LANDING_HERO_ROTATION_SLUGS`/`landingHeroRotationPortraits` in `featured-expert.ts`, and the `LandingReviews`/`getLandingPublicReviews` review-fetch pipeline are all still in the tree but no longer reachable from any live page after the search-hero redesign replaced the old goal-relay chat hero and dropped the landing reviews section.

**Why:** The API route still does live LLM calls and DB writes if hit directly — it's unreachable-from-UI attack surface that still burns LLM budget. The rest is pure dead code (unused exports, an unread cache-revalidation tag) adding maintenance weight.

**Context:** Surfaced by the maintainability specialist and Claude adversarial review during `/ship` on 2026-08-10. Real reviews (`ExpertReviews` on the profile page) are unaffected and still live — only the landing-page review teaser and its data pipeline are orphaned.

**Effort:** M
**Priority:** P2
**Depends on:** None

### Add e2e coverage for the re-themed expert profile page

**What:** `expert-profile-client.tsx` was fully restructured (cover-hero + two-column body + sticky booking card) in the 2026-08-10 light re-theme, but no Playwright spec exercises the profile page at all.

**Why:** A full-page rewrite with zero e2e coverage is exactly where a silent regression could ship undetected.

**Context:** Surfaced by the `/ship` coverage audit on 2026-08-10 (14/30 paths verified, 47%). Also worth covering: the `ExpertIntroMedia` `hideLabel` prop, the reviews rating-summary block, and the `.experts-profile--light` scoping that must never bleed into `/experts/[slug]/video-request`.

**Effort:** M
**Priority:** P2
**Depends on:** None

## Completed
