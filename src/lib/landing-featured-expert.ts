import type { ListedExpert } from '@/lib/mentor-directory';
import { toOptimizedImageUrl } from '@/lib/public-images';

export const LANDING_FEATURED_EXPERT_SLUG = 'eiman';
export const LANDING_HERO_EXPERT_SLUG = 'chris-sembroski';
export const EIMAN_JAHANGIR_NAME = 'Eiman Jahangir';

const EIMAN_PORTRAIT = '/eiman.webp';
const CHRIS_PORTRAIT = '/chris_sembroski.webp';

function isEimanExpert(expert: ListedExpert): boolean {
  const slug = expert.slug.toLowerCase();
  const name = expert.name.toLowerCase();
  return slug === LANDING_FEATURED_EXPERT_SLUG || slug.includes('eiman') || name.includes('eiman');
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

export function landingFeaturedPortrait(expert: ListedExpert | null): { src: string; alt: string } {
  if (expert && isEimanExpert(expert)) {
    return { src: EIMAN_PORTRAIT, alt: expert.name };
  }

  if (expert) {
    return { src: toOptimizedImageUrl(expert.imageUrl), alt: expert.name };
  }

  return { src: EIMAN_PORTRAIT, alt: `${EIMAN_JAHANGIR_NAME}, verified aerospace expert` };
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

function toLandingRelayExpert(expert: ListedExpert): LandingRelayExpert {
  let portraitSrc = toOptimizedImageUrl(expert.imageUrl);
  if (isChrisExpert(expert)) {
    portraitSrc = CHRIS_PORTRAIT;
  } else if (isEimanExpert(expert)) {
    portraitSrc = EIMAN_PORTRAIT;
  }

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
  role: 'Propulsion & systems engineer',
  portraitSrc: EIMAN_PORTRAIT,
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
    return "I've walked this path — worth talking through what actually moved the needle, not generic advice from the internet.";
  }

  if (expert.slug === LANDING_FEATURED_EXPERT_SLUG || expert.name.toLowerCase().includes('eiman')) {
    return "Questions like this benefit from someone who's built and operated real hardware — not a compiled summary.";
  }

  return `A verified expert like ${expert.firstName} can help you with that — live, 1:1.`;
}

export function landingRelayReplyCta(expert: LandingRelayExpert): string {
  return `Create a free account to explore ${expert.firstName} and other verified experts who fit your goal.`;
}