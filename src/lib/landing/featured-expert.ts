import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';

/** Canonical public slug — must match mentors.slug in Supabase. */
export const LANDING_FEATURED_EXPERT_SLUG = 'eiman-jahangir';
export const LANDING_HERO_EXPERT_SLUG = 'chris-sembroski';
export const EIMAN_JAHANGIR_NAME = 'Eiman Jahangir';

/** Local hero assets used only when roster is empty or for Chris landing polish. */
const EIMAN_PORTRAIT_FALLBACK = '/eiman.webp';
const CHRIS_PORTRAIT = '/chris_sembroski.webp';

function isEimanExpert(expert: ListedExpert): boolean {
  const slug = expert.slug.toLowerCase();
  const name = expert.name.toLowerCase();
  return (
    slug === LANDING_FEATURED_EXPERT_SLUG ||
    slug === 'eiman' ||
    slug.includes('eiman') ||
    name.includes('eiman')
  );
}

function isChrisExpert(expert: ListedExpert): boolean {
  const slug = expert.slug.toLowerCase();
  const name = expert.name.toLowerCase();
  return (
    slug === LANDING_HERO_EXPERT_SLUG ||
    slug.includes('chris-sembroski') ||
    name.includes('chris sembroski')
  );
}

export function findLandingHeroExpert(experts: ListedExpert[]): ListedExpert | null {
  return (
    experts.find((expert) => expert.slug === LANDING_HERO_EXPERT_SLUG) ??
    experts.find((expert) => isChrisExpert(expert)) ??
    null
  );
}

export function findLandingFeaturedExpert(experts: ListedExpert[]): ListedExpert | null {
  return (
    experts.find((expert) => expert.slug === LANDING_FEATURED_EXPERT_SLUG) ??
    experts.find((expert) => isEimanExpert(expert)) ??
    null
  );
}

export function orderLandingExperts(experts: ListedExpert[]): ListedExpert[] {
  const featured = findLandingFeaturedExpert(experts);
  if (!featured) return experts;
  return [featured, ...experts.filter((expert) => expert.id !== featured.id)];
}

/** Fixed roster + order for the landing page's bottom expert directory grid. */
const LANDING_DIRECTORY_NAME_ORDER = ['eiman', 'chris', 'priya', 'jenni', 'andrew'] as const;

export function orderLandingDirectoryExperts(experts: ListedExpert[]): ListedExpert[] {
  const used = new Set<string>();
  const ordered: ListedExpert[] = [];
  for (const key of LANDING_DIRECTORY_NAME_ORDER) {
    const match = experts.find(
      (expert) => !used.has(expert.id) && expert.name.toLowerCase().includes(key),
    );
    if (match) {
      ordered.push(match);
      used.add(match.id);
    }
  }
  return ordered;
}

export function landingHeroPortrait(experts: ListedExpert[]): {
  src: string;
  alt: string;
  href: string;
} {
  const heroExpert = findLandingHeroExpert(experts);
  const href = heroExpert
    ? `/experts/${heroExpert.slug}`
    : `/experts/${LANDING_HERO_EXPERT_SLUG}`;

  if (heroExpert && isChrisExpert(heroExpert)) {
    return { src: CHRIS_PORTRAIT, alt: heroExpert.name, href };
  }

  if (heroExpert) {
    return {
      src: toOptimizedImageUrl(heroExpert.imageUrl),
      alt: heroExpert.name,
      href,
    };
  }

  return {
    src: CHRIS_PORTRAIT,
    alt: 'Chris Sembroski, verified aerospace expert',
    href: `/experts/${LANDING_HERO_EXPERT_SLUG}`,
  };
}

export type LandingHeroStripPortrait = {
  slug: string;
  name: string;
  src: string;
  alt: string;
};

/** Cap for multi-face hero helpers (currently deferred on homepage; see DESIGN.md). */
export const LANDING_HERO_STRIP_MAX = 3;

/**
 * Hero visual rotation order (homepage assessment magnet).
 * Overrides the older DESIGN.md “single Chris billboard only” shipping note —
 * founder request 2026-08-08: rotate Chris → Priya → Eiman on the hero card.
 */
export const LANDING_HERO_ROTATION_SLUGS = [
  'chris-sembroski',
  'priya-abiram',
  'eiman-jahangir',
] as const;

const HERO_ROTATION_LOCAL_FALLBACKS: Partial<
  Record<(typeof LANDING_HERO_ROTATION_SLUGS)[number], { name: string; src: string }>
> = {
  'chris-sembroski': { name: 'Chris Sembroski', src: CHRIS_PORTRAIT },
  'eiman-jahangir': { name: EIMAN_JAHANGIR_NAME, src: EIMAN_PORTRAIT_FALLBACK },
  // Priya has no local asset — require roster image_url when present.
};

/**
 * Portraits for the hero card rotation (Chris → Priya → Eiman).
 * Prefer live roster media; Chris/Eiman fall back to local assets if missing.
 */
export function landingHeroRotationPortraits(
  experts: ListedExpert[],
): LandingHeroStripPortrait[] {
  const out: LandingHeroStripPortrait[] = [];

  for (const slug of LANDING_HERO_ROTATION_SLUGS) {
    const fromRoster = experts.find((e) => e.slug === slug);
    if (fromRoster) {
      const relay = listedExpertToRelay(fromRoster);
      out.push({
        slug: fromRoster.slug,
        name: fromRoster.name,
        src: relay.portraitSrc,
        alt: fromRoster.name,
      });
      continue;
    }
    const fallback = HERO_ROTATION_LOCAL_FALLBACKS[slug];
    if (fallback) {
      out.push({
        slug,
        name: fallback.name,
        src: fallback.src,
        alt: fallback.name,
      });
    }
  }

  if (out.length === 0) {
    return [
      {
        slug: LANDING_HERO_EXPERT_SLUG,
        name: 'Chris Sembroski',
        src: CHRIS_PORTRAIT,
        alt: 'Chris Sembroski, verified aerospace expert',
      },
    ];
  }

  return out;
}

/**
 * Ordered portraits (Chris first, then roster). Used for multi-expert experiments;
 * homepage hero ships single-face via landingHeroPortrait. Empty roster → Chris fallback.
 */
export function landingHeroPortraitStrip(
  experts: ListedExpert[],
  max = LANDING_HERO_STRIP_MAX,
): LandingHeroStripPortrait[] {
  const limit = Math.max(1, max);
  const chris = findLandingHeroExpert(experts);
  const rest = experts.filter((expert) => !isChrisExpert(expert));

  const ordered: ListedExpert[] = [];
  if (chris) {
    ordered.push(chris);
  }
  for (const expert of rest) {
    if (ordered.length >= limit) break;
    ordered.push(expert);
  }

  if (ordered.length === 0) {
    return [
      {
        slug: LANDING_HERO_EXPERT_SLUG,
        name: 'Chris Sembroski',
        src: CHRIS_PORTRAIT,
        alt: 'Chris Sembroski, verified aerospace expert',
      },
    ];
  }

  return ordered.slice(0, limit).map((expert) => {
    const relay = listedExpertToRelay(expert);
    return {
      slug: expert.slug,
      name: expert.name,
      src: relay.portraitSrc,
      alt: expert.name,
    };
  });
}

/** Portrait for the featured expert — prefers Supabase/roster image_url. */
export function landingFeaturedPortrait(expert: ListedExpert | null): { src: string; alt: string } {
  if (expert) {
    return { src: toOptimizedImageUrl(expert.imageUrl), alt: expert.name };
  }

  return {
    src: EIMAN_PORTRAIT_FALLBACK,
    alt: `${EIMAN_JAHANGIR_NAME}, verified aerospace expert`,
  };
}

export type LandingRelayExpert = {
  slug: string;
  name: string;
  firstName: string;
  role: string;
  portraitSrc: string;
  portraitAlt: string;
  profileHref: string;
};

const PROPULSION_GOAL_PATTERN =
  /propulsion|engine|rocket|thrust|combustion|nozzle|fuel|launch vehicle|ion drive/i;
const CAREER_GOAL_PATTERN =
  /astronaut|career|intern|internship|job|work in space|break into|how do i become|where should i start/i;

export function listedExpertToRelay(expert: ListedExpert): LandingRelayExpert {
  // Chris keeps a polished local hero crop; everyone else (including Eiman) uses roster media.
  const portraitSrc = isChrisExpert(expert)
    ? CHRIS_PORTRAIT
    : toOptimizedImageUrl(expert.imageUrl);

  return {
    slug: expert.slug,
    name: expert.name,
    firstName: expert.name.trim().split(/\s+/)[0] ?? expert.name,
    role: expert.role,
    portraitSrc,
    portraitAlt: expert.name,
    profileHref: `/experts/${expert.slug}`,
  };
}

function toLandingRelayExpert(expert: ListedExpert): LandingRelayExpert {
  return listedExpertToRelay(expert);
}

const CHRIS_RELAY_FALLBACK: LandingRelayExpert = {
  slug: LANDING_HERO_EXPERT_SLUG,
  name: 'Chris Sembroski',
  firstName: 'Chris',
  role: 'Inspiration4 Astronaut & Aerospace Engineer',
  portraitSrc: CHRIS_PORTRAIT,
  portraitAlt: 'Chris Sembroski',
  profileHref: `/experts/${LANDING_HERO_EXPERT_SLUG}`,
};

const EIMAN_RELAY_FALLBACK: LandingRelayExpert = {
  slug: LANDING_FEATURED_EXPERT_SLUG,
  name: EIMAN_JAHANGIR_NAME,
  firstName: 'Eiman',
  role: 'Cardiologist & commercial astronaut',
  portraitSrc: EIMAN_PORTRAIT_FALLBACK,
  portraitAlt: EIMAN_JAHANGIR_NAME,
  profileHref: `/experts/${LANDING_FEATURED_EXPERT_SLUG}`,
};

/** Pick Chris or Eiman to personify the expert relay after a learning-goal submit. */
export function pickLandingRelayExpert(goal: string, experts: ListedExpert[]): LandingRelayExpert {
  const chris = findLandingHeroExpert(experts);
  const eiman = findLandingFeaturedExpert(experts);
  const trimmed = goal.trim();

  if (PROPULSION_GOAL_PATTERN.test(trimmed)) {
    return eiman ? toLandingRelayExpert(eiman) : EIMAN_RELAY_FALLBACK;
  }

  if (CAREER_GOAL_PATTERN.test(trimmed)) {
    return chris ? toLandingRelayExpert(chris) : CHRIS_RELAY_FALLBACK;
  }

  const picked = trimmed.length % 2 === 0 ? (chris ?? eiman) : (eiman ?? chris);
  if (picked) {
    return toLandingRelayExpert(picked);
  }

  return trimmed.length % 2 === 0 ? CHRIS_RELAY_FALLBACK : EIMAN_RELAY_FALLBACK;
}

export function landingRelayReplyIntro(expert: LandingRelayExpert): string {
  if (expert.slug === LANDING_HERO_EXPERT_SLUG || expert.name.toLowerCase().includes('chris')) {
    return "Worth talking through what actually moved the needle — not another generic career list.";
  }

  if (
    expert.slug === LANDING_FEATURED_EXPERT_SLUG ||
    expert.slug.includes('eiman') ||
    expert.name.toLowerCase().includes('eiman')
  ) {
    return "This is the kind of question that benefits from someone who's built and operated real hardware.";
  }

  return `A verified expert like ${expert.firstName} can help with that — live, 1:1.`;
}

/** Second bubble after the teaser — pushes live session, not more free AI. */
export function landingRelayReplyCta(expert: LandingRelayExpert): string {
  return `Continue this conversation with real expert advice from ${expert.firstName} — live, 1:1.`;
}
