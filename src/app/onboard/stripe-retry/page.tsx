import { requireRole } from '@/lib/require-session';
import StripeRetryClient from './stripe-retry-client';

export default async function StripeRetryPage() {
  await requireRole('mentor');
  return <StripeRetryClient />;
}
