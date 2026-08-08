import { getLandingPublicReviews } from '@/lib/expert-reviews/get-landing-public-reviews';
import { listPublicMentors } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import LandingPage from './landing-page';
import LandingSignedInShell from './landing-signed-in-shell';

/** Cached mentor directory + reviews; page shell is static HTML with small client islands. */
export const revalidate = 300;

export default async function Home() {
  const [experts, session, reviews] = await Promise.all([
    listPublicMentors(),
    getSession(),
    getLandingPublicReviews(),
  ]);

  if (session) {
    return <LandingSignedInShell session={session} experts={experts} />;
  }

  return <LandingPage experts={experts} reviews={reviews} />;
}
