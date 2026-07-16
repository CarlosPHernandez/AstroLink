/**
 * AstroLink press updates — edit this file to publish new items at /press.
 * No database; redeploy to ship changes.
 */
export type PressUpdate = {
  id: string;
  date: string;
  headline: string;
  summary: string;
  link?: { label: string; href: string };
};

export const PRESS_PAGE = {
  contactEmail: 'support@astro-link.space',
  intro:
    'News and announcements from AstroLink. For press inquiries, reach out by email.',
  updates: [
    
    {
      id: 'early-access',
      date: 'June 2026',
      headline: 'Early access waitlist opens',
      summary:
        'AstroLink opened its early access waitlist for live video sessions with verified astronauts, flight controllers, and operators.',
      link: { label: 'Book with Chris', href: '/talk-with-chris' },
    },
  ] satisfies PressUpdate[],
};