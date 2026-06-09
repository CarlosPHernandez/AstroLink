import { listPublicMentors } from '@/lib/mentor-directory';
import LandingPage from './landing-page';

/** Cached mentor directory; page shell is static HTML with small client islands. */
export const revalidate = 300;

export default async function Home() {
  const experts = await listPublicMentors();
  return <LandingPage experts={experts} />;
}
