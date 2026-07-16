import { redirect } from 'next/navigation';
import { buildWaitlistLandingRedirect } from '@/lib/waitlist/waitlist-landing';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Retired — waitlist signups collected; public traffic goes to Chris campaign. */
export default async function EarlyAccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      qs.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      qs.set(key, value[0]);
    }
  }
  const search = qs.toString() ? `?${qs.toString()}` : '';
  redirect(buildWaitlistLandingRedirect('/early-access', search));
}