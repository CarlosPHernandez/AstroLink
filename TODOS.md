# TODOS

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

### Update or remove the hardcoded "Deadline Aug 17, 2026" pill

**What:** `landing-participation.tsx`'s hackathon status pills hardcode "Deadline Aug 17, 2026" as static text with no expiry logic.

**Why:** Will read as stale/wrong on the live site once that date passes.

**Context:** Flagged by the Claude adversarial review on 2026-08-10.

**Effort:** S
**Priority:** P1
**Depends on:** None

### Add e2e coverage for the re-themed expert profile page

**What:** `expert-profile-client.tsx` was fully restructured (cover-hero + two-column body + sticky booking card) in the 2026-08-10 light re-theme, but no Playwright spec exercises the profile page at all.

**Why:** A full-page rewrite with zero e2e coverage is exactly where a silent regression could ship undetected.

**Context:** Surfaced by the `/ship` coverage audit on 2026-08-10 (14/30 paths verified, 47%). Also worth covering: the `ExpertIntroMedia` `hideLabel` prop, the reviews rating-summary block, and the `.experts-profile--light` scoping that must never bleed into `/experts/[slug]/video-request`.

**Effort:** M
**Priority:** P2
**Depends on:** None

## Completed
