/**
 * Locked public card copy for Variation B.
 * Homepage card = name, ship title, one proof line, live rate.
 * If this fights Variation B hero/nav/CTAs, those strings win.
 * If live rates move, keep titles and proof; take $ from the directory API.
 */

export type PublicExpertCopy = {
  slug: string;
  title: string;
  proof: string;
  ctaFirstName: string;
  question: string;
  answer: string;
};

const PUBLIC_EXPERT_COPY: PublicExpertCopy[] = [
  {
    slug: 'chris-sembroski',
    title: 'Inspiration4 astronaut · aerospace engineer',
    proof: '3 days in orbit on Inspiration4.',
    ctaFirstName: 'Chris',
    question: 'I want to switch into aerospace. What paths actually work?',
    answer:
      'There are a few routes that actually work — happy to walk through what worked for me and where most people get stuck.',
  },
  {
    slug: 'eiman-jahangir',
    title: 'Cardiologist-astronaut · Blue Origin NS-26',
    proof: '704th person in space. Blue Origin NS-26.',
    ctaFirstName: 'Eiman',
    question: 'I keep getting rejected. How did you stay in the fight long enough to actually fly?',
    answer:
      'The government path closed. The commercial path did not. I can walk you through what I changed after the NASA boards.',
  },
  {
    slug: 'priya-abiram',
    title: 'Director of Research, Operation Period · OP-01',
    proof: 'Research lead, first menstruation-in-space flight.',
    ctaFirstName: 'Priya',
    question: 'I am an engineer who wants human-spaceflight work. Where do I actually start?',
    answer:
      'Internships and analog work beat another generic cover letter. I can map the path I used across NASA, Blue Origin, Boeing, and VAST.',
  },
  {
    slug: 'jenni-hesterman',
    title: 'Col, USAF (ret) · analog astronaut',
    proof: 'Secured Andrews AFB, including Air Force One.',
    ctaFirstName: 'Jenni',
    question: 'How do space programs and analog habitats actually think about safety and threat?',
    answer:
      'I ran installation security at Andrews, including Air Force One, and I now command and advise analog missions. We can talk threat, standards, and how to get into that work.',
  },
  {
    slug: 'andrew-parris',
    title: 'NASA TV engineer · President, The Inspired24',
    proof: '13 years inside NASA TV.',
    ctaFirstName: 'Titan',
    question: 'How do I even start networking in this industry?',
    answer:
      'Most people wait for a badge. Start with a real conversation and a specific ask. I spent 13 years inside NASA TV and I still use the same rule.',
  },
  {
    slug: 'david-guajardo',
    title: 'Founder, Mexanauta · space-ops trainee',
    proof: 'NASA JSC Exploration Atmosphere 8 crew.',
    ctaFirstName: 'David',
    question: 'I speak Spanish and I want into the industry. What is the realistic first move?',
    answer:
      'Start where the work is and translate it for your community. That is what Mexanauta is. We can map certifications, analog time, and how I got to JSC.',
  },
];

const COPY_BY_SLUG = new Map(PUBLIC_EXPERT_COPY.map((entry) => [entry.slug, entry]));

export function normalizeExpertSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function publicExpertCopyForSlug(slug: string): PublicExpertCopy | null {
  return COPY_BY_SLUG.get(normalizeExpertSlug(slug)) ?? null;
}

export function publicExpertTitle(slug: string, fallback: string): string {
  return publicExpertCopyForSlug(slug)?.title ?? fallback;
}

export function publicExpertProof(slug: string): string | null {
  return publicExpertCopyForSlug(slug)?.proof ?? null;
}

export function publicExpertCtaFirstName(slug: string, displayName: string): string {
  const fromCopy = publicExpertCopyForSlug(slug)?.ctaFirstName;
  if (fromCopy) return fromCopy;
  return displayName.trim().split(/\s+/)[0] ?? displayName;
}

/** Homepage chips → /experts?topic= (inventory, not assessment). */
export const HOMEPAGE_TOPIC_CHIPS = [
  { label: 'Astronauts', topic: 'astronauts' },
  { label: 'Flight ops', topic: 'flight-ops' },
  { label: 'Engineering', topic: 'engineering' },
  { label: 'Careers', topic: 'careers' },
] as const;

export type HomepageTopic = (typeof HOMEPAGE_TOPIC_CHIPS)[number]['topic'];

const HOMEPAGE_TOPIC_SLUGS: Record<HomepageTopic, string[] | null> = {
  astronauts: ['chris-sembroski', 'eiman-jahangir'],
  'flight-ops': ['andrew-parris', 'jenni-hesterman', 'david-guajardo'],
  engineering: ['priya-abiram', 'chris-sembroski', 'andrew-parris', 'david-guajardo'],
  careers: null,
};

export function isHomepageTopic(value: string | null): value is HomepageTopic {
  return HOMEPAGE_TOPIC_CHIPS.some((chip) => chip.topic === value);
}

export function filterExpertsByHomepageTopic<T extends { slug: string }>(
  experts: T[],
  topic: string | null,
): T[] {
  if (!isHomepageTopic(topic)) return experts;
  const slugs = HOMEPAGE_TOPIC_SLUGS[topic];
  if (!slugs) return experts;
  const allowed = new Set(slugs);
  return experts.filter((expert) => allowed.has(normalizeExpertSlug(expert.slug)));
}
