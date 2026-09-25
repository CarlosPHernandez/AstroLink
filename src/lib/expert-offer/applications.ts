import 'server-only';
import type { ExpertApplication } from '@/lib/expert-offer/schema';
import { supabaseAdmin } from '@/lib/supabase';

export type ExpertApplicationSubmitResult = {
  /** Null only when a concurrent insert won and the winning row could not be re-read. */
  id: string | null;
  /** False when a submitted row for this email already existed. */
  created: boolean;
};

type ApplicationIdRow = { id: string };

type DbError = {
  message: string;
  code?: string;
  details?: string | null;
};

type QueryResult<T> = {
  data: T;
  error: DbError | null;
};

type ApplicationsFilter = {
  eq: (column: string, value: string) => ApplicationsFilter;
  limit: (count: number) => ApplicationsFilter;
  maybeSingle: () => Promise<QueryResult<ApplicationIdRow | null>>;
};

type ApplicationsInsert = {
  select: (columns: string) => {
    single: () => Promise<QueryResult<ApplicationIdRow | null>>;
  };
};

type ApplicationsQuery = {
  select: (columns: string) => ApplicationsFilter;
  insert: (row: Record<string, unknown>) => ApplicationsInsert;
};

const SUBMIT_FAILED = 'Could not submit. Try again.';
const SUBMITTED_EMAIL_INDEX = 'expert_applications_one_submitted_email';

function applications(): ApplicationsQuery {
  // Table is not in database.types.ts yet. Service role only; no anon policy.
  const client = supabaseAdmin as unknown as {
    from: (table: 'expert_applications') => ApplicationsQuery;
  };
  return client.from('expert_applications');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isSubmittedEmailConflict(error: DbError | null): boolean {
  if (error?.code !== '23505') return false;
  const named = `${error.message ?? ''} ${error.details ?? ''}`;
  if (named.includes(SUBMITTED_EMAIL_INDEX)) return true;
  // Code-only 23505: this insert's other unique key is the generated primary key.
  return !/violates unique constraint/i.test(named);
}

async function findSubmittedId(email: string): Promise<string | null> {
  const existing = await applications()
    .select('id')
    .eq('email', email)
    .eq('status', 'submitted')
    .limit(1)
    .maybeSingle();

  if (existing.error) return null;
  return existing.data?.id ?? null;
}

function videoColumns(input: ExpertApplication): {
  video_requests_enabled: boolean;
  video_request_price_cents: number;
  video_request_sla_days: number;
} {
  if (!input.videoRequest.enabled) {
    // sla_days CHECK is 3–14 even when video requests are off.
    return {
      video_requests_enabled: false,
      video_request_price_cents: 0,
      video_request_sla_days: 7,
    };
  }

  return {
    video_requests_enabled: true,
    video_request_price_cents: input.videoRequest.priceCents,
    video_request_sla_days: input.videoRequest.slaDays,
  };
}

export async function submitExpertApplication(
  input: ExpertApplication,
): Promise<ExpertApplicationSubmitResult> {
  const email = normalizeEmail(input.email);

  const existing = await applications()
    .select('id')
    .eq('email', email)
    .eq('status', 'submitted')
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    throw new Error(SUBMIT_FAILED);
  }

  if (existing.data?.id) {
    return { id: existing.data.id, created: false };
  }

  const inserted = await applications()
    .insert({
      full_name: input.fullName,
      email,
      employer: input.employer,
      expertise: input.expertise,
      bio: input.bio,
      hourly_rate_cents: input.hourlyRateDollars * 100,
      services: input.services,
      ...videoColumns(input),
      timezone: input.timezone,
      windows: input.windows.map((window) => ({
        weekday: window.weekday,
        startMinute: window.startMinute,
        endMinute: window.endMinute,
      })),
      is_civil_servant: input.isCivilServant,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (isSubmittedEmailConflict(inserted.error)) {
    return { id: await findSubmittedId(email), created: false };
  }

  if (inserted.error || !inserted.data?.id) {
    throw new Error(SUBMIT_FAILED);
  }

  return { id: inserted.data.id, created: true };
}
