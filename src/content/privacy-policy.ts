/**
 * AstroLink Privacy Policy — edit this file to update published policy text.
 * Changes appear at /privacy after deploy. Bump `lastUpdated` when you ship edits.
 */
export type PrivacyPolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const PRIVACY_POLICY = {
  lastUpdated: 'June 18, 2026',
  contactEmail: 'hello@astro-link.space',
  intro:
    'AstroLink ("we," "us," or "our") is a service of Helios Nexus, Inc., a Delaware corporation explains here how we collect, use, and protect personal information when you use astrolink.ai and related services.',
  sections: [
    {
      id: 'information-we-collect',
      title: 'Information we collect',
      paragraphs: ['Depending on how you use AstroLink, we may collect:'],
      bullets: [
        'Waitlist signups: email address and optional marketing referrer (from ?ref= links).',
        'Account data: name, email, and profile details when you create an account.',
        'Booking and session data: session times, expert selections, briefing notes you provide, and post-session artifacts such as transcripts or recaps when those features are enabled.',
        'Payment data: billing details processed by Stripe. We do not store full card numbers on our servers.',
        'Technical data: device/browser type, IP address, and cookies needed to keep you signed in or secure the service.',
      ],
    },
    {
      id: 'how-we-use',
      title: 'How we use information',
      paragraphs: ['We use personal information to:'],
      bullets: [
        'Operate the waitlist and notify you when early access or booking opens.',
        'Provide, secure, and improve video sessions, booking, and expert marketplace features.',
        'Process payments and prevent fraud or abuse.',
        'Respond to support requests and send service-related messages.',
        'Measure marketing performance (for example, which referral link led to a signup).',
      ],
    },
    {
      id: 'waitlist',
      title: 'Early access waitlist',
      paragraphs: [
        'The /early-access waitlist is single opt-in: when you submit a valid email, you are added to our list immediately. We do not require a confirmation click to join.',
        'We send waitlist-related email only for product updates about early access and launch—not a recurring newsletter unless you opt into additional communications later.',
        'You may request removal at any time by emailing us at the address below.',
        'We collect anonymous interaction events on the waitlist page (for example, whether the signup form was viewed or submitted) through Vercel Web Analytics. These events do not include your email address.',
      ],
    },
    {
      id: 'chris-booking',
      title: 'Chris campaign booking',
      paragraphs: [
        'We collect anonymous interaction events on the Chris booking funnel (for example, whether a booking step was started or completed) through Vercel Web Analytics. These events do not include your email address or payment details.',
      ],
    },
    {
      id: 'space-path-assessment',
      title: 'Space Path Assessment',
      paragraphs: [
        'When you complete the free Space Path Assessment, we store your answers and generated report, and we email the report to the address you provide. We also collect anonymous interaction events on the assessment funnel (for example, whether the form was started, completed, or a next-step CTA was clicked) through Vercel Web Analytics. Analytics events do not include your email address or report contents.',
      ],
    },
    {
      id: 'sharing',
      title: 'When we share information',
      paragraphs: [
        'We do not sell your personal information. We share data only with service providers that help us run AstroLink, under contracts that limit their use of your data, including:',
        'We may also disclose information if required by law or to protect the rights, safety, and security of AstroLink, our users, or the public.',
      ],
      bullets: [
        'Supabase (database and authentication infrastructure).',
        'Stripe (payments).',
        'Daily (video sessions and related session features).',
        'Hosting and infrastructure providers (for example, Vercel).',
        'Email delivery providers when we send product or transactional messages.',
      ],
    },
    {
      id: 'retention',
      title: 'Data retention',
      paragraphs: [
        'We keep waitlist emails until you ask us to delete them or they are no longer needed for launch communications.',
        'Account, booking, and session records are retained as long as your account is active and as needed for legal, tax, and safety obligations.',
      ],
    },
    {
      id: 'security',
      title: 'Security',
      paragraphs: [
        'We use industry-standard safeguards including encrypted connections, access controls, and service-role boundaries for sensitive operations. No method of transmission or storage is 100% secure.',
      ],
    },
    {
      id: 'your-rights',
      title: 'Your choices and rights',
      paragraphs: ['Depending on where you live, you may have rights to access, correct, delete, or export your personal information. To exercise these rights, contact us at:'],
      bullets: ['Email: hello@astro-link.space'],
    },
    {
      id: 'children',
      title: 'Children',
      paragraphs: [
        'AstroLink is not directed to children under 16, and we do not knowingly collect their personal information.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      paragraphs: [
        'We may update this policy from time to time. We will post the revised version on this page and update the "Last updated" date above.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      paragraphs: [
        'Questions about this policy or our data practices:',
        'AstroLink — hello@astro-link.space',
      ],
    },
  ] satisfies PrivacyPolicySection[],
} as const;