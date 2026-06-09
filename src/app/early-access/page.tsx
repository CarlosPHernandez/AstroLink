import type { Metadata } from 'next';
import EarlyAccessClient from './early-access-client';

export const metadata: Metadata = {
  title: 'Early Access | AstroLink',
  description:
    'Join the waitlist for AstroLink — live 1:1 video sessions with verified aerospace experts, including Inspiration4 astronaut Chris Sembroski.',
  openGraph: {
    title: 'Early Access | AstroLink',
    description:
      'Book live sessions with astronauts, flight controllers, and aerospace operators. Request early access.',
  },
};

export default function EarlyAccessPage() {
  return <EarlyAccessClient copyrightYear={new Date().getFullYear()} />;
}
