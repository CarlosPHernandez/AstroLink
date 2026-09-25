import 'server-only';
import { createOrUpdateMentor, type CreateMentorBody } from '@/lib/admin-create-mentor';
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
  order: (column: string, options: { ascending: boolean }) => ApplicationsFilter;
  limit: (count: number) => ApplicationsFilter;
  maybeSingle: () => Promise<QueryResult<Record<string, unknown> | null>>;
};

type ApplicationsInsert = {
  select: (columns: string) => {
    single: () => Promise<QueryResult<ApplicationIdRow | null>>;
  };
};

type ApplicationsUpdate = PromiseLike<QueryResult<null>> & {
  eq: (column: string, value: string) => ApplicationsUpdate;
  select: (columns: string) => PromiseLike<QueryResult<Array<{ id: string }> | null>>;
};

type MentorEmailLookup = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<QueryResult<{ id: string } | null>>;
    };
  };
};

type ApplicationsQuery = {
  select: (columns: string) => ApplicationsFilter;
  insert: (row: Record<string, unknown>) => ApplicationsInsert;
  update: (row: Record<string, unknown>) => ApplicationsUpdate;
};

type MentorWrite = {
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<QueryResult<null>>;
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<QueryResult<null>>;
  };
  insert: (rows: Record<string, unknown>[]) => Promise<QueryResult<null>>;
};

const LIST_COLUMNS =
  'id, full_name, email, employer, hourly_rate_cents, services, status, created_at, is_civil_servant';
const DETAIL_COLUMNS =
  'id, full_name, email, employer, expertise, bio, hourly_rate_cents, services, video_requests_enabled, video_request_price_cents, video_request_sla_days, timezone, windows, status, is_civil_servant';
const REVIEW_FAILED = 'Could not review application.';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type AdminExpertApplicationSummary = {
  id: string;
  fullName: string;
  email: string;
  employer: string;
  hourlyRateCents: number;
  services: string[];
  status: string;
  createdAt: string;
  isCivilServant: boolean;
};

export type ReviewExpertApplicationResult =
  | { ok: true; mentorId?: string }
  | { ok: false; status: 404 | 409; error: string };

type LoadedApplication = {
  id: string;
  full_name: string;
  email: string;
  employer: string;
  expertise: string;
  bio: string;
  hourly_rate_cents: number;
  services: string[];
  video_requests_enabled: boolean;
  video_request_price_cents: number;
  video_request_sla_days: number;
  timezone: string;
  windows: unknown;
  status: string;
  is_civil_servant: boolean;
};

type ListRow = {
  id: string;
  full_name: string;
  email: string;
  employer: string;
  hourly_rate_cents: number;
  services: string[] | null;
  status: string;
  created_at: string;
  is_civil_servant: boolean | null;
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

function mentorWrite(table: 'mentors' | 'mentor_availability_windows'): MentorWrite {
  // offered_services, timezone, and availability windows are not in database.types.ts yet.
  const client = supabaseAdmin as unknown as {
    from: (name: 'mentors' | 'mentor_availability_windows') => MentorWrite;
  };
  return client.from(table);
}

function mentorIdByEmail(email: string): Promise<QueryResult<{ id: string } | null>> {
  const client = supabaseAdmin as unknown as {
    from: (name: 'mentors') => MentorEmailLookup;
  };
  return client.from('mentors').select('id').eq('email', email).maybeSingle();
}

function rowId(data: Record<string, unknown> | null): string | null {
  return typeof data?.id === 'string' ? data.id : null;
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
  return rowId(existing.data);
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

  const existingId = rowId(existing.data);
  if (existingId) {
    return { id: existingId, created: false };
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

function assertWrite(result: QueryResult<unknown>): void {
  if (result.error) throw new Error(REVIEW_FAILED);
}

function splitExpertise(expertise: string): string[] {
  return expertise
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 12);
}

function slugFromName(fullName: string): string {
  const slug = fullName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (slug.length >= 2 && SLUG_PATTERN.test(slug)) return slug;
  return 'expert';
}

function slugWithNumericSuffix(slug: string): string {
  const base = slug.slice(0, 78).replace(/-+$/g, '');
  return `${base.length >= 2 ? base : 'expert'}-2`;
}

function isSlugTakenError(error: unknown, slug: string): boolean {
  return error instanceof Error && error.message === `Slug "${slug}" is already used by another mentor.`;
}

function windowsFromJson(value: unknown): Array<{ weekday: number; startMinute: number; endMinute: number }> {
  if (!Array.isArray(value)) throw new Error(REVIEW_FAILED);
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error(REVIEW_FAILED);
    const record = item as Record<string, unknown>;
    const { weekday, startMinute, endMinute } = record;
    if (
      typeof weekday !== 'number' ||
      typeof startMinute !== 'number' ||
      typeof endMinute !== 'number'
    ) {
      throw new Error(REVIEW_FAILED);
    }
    return { weekday, startMinute, endMinute };
  });
}

function mentorInput(row: LoadedApplication, slug: string): CreateMentorBody {
  // complianceStatus stays unset so createOrUpdateMentor keeps its approved default,
  // except civil servants, who need document review before they can be approved.
  return {
    email: row.email.trim().toLowerCase(),
    fullName: row.full_name.trim(),
    slug,
    employer: row.employer,
    expertise: splitExpertise(row.expertise),
    bio: row.bio,
    liveSessionPriceCents: row.hourly_rate_cents,
    isListed: false,
    ...(row.is_civil_servant ? { complianceStatus: 'document_required' as const } : {}),
  } as CreateMentorBody;
}

async function createUnlistedMentor(row: LoadedApplication) {
  const slug = slugFromName(row.full_name);
  try {
    return await createOrUpdateMentor(mentorInput(row, slug));
  } catch (error) {
    if (!isSlugTakenError(error, slug)) throw error;
    return await createOrUpdateMentor(mentorInput(row, slugWithNumericSuffix(slug)));
  }
}

async function copyOfferOntoMentor(mentorId: string, row: LoadedApplication): Promise<void> {
  // createOrUpdateMentor does not write offered_services. Set the offer columns on that row only.
  const updated = await mentorWrite('mentors')
    .update({
      offered_services: row.services,
      video_requests_enabled: row.video_requests_enabled,
      video_request_price_cents: row.video_request_price_cents,
      video_request_sla_days: row.video_request_sla_days,
      timezone: row.timezone,
    })
    .eq('id', mentorId);
  assertWrite(updated);

  const windows = windowsFromJson(row.windows);
  const deleted = await mentorWrite('mentor_availability_windows').delete().eq('mentor_id', mentorId);
  assertWrite(deleted);
  if (windows.length === 0) return;

  const inserted = await mentorWrite('mentor_availability_windows').insert(
    windows.map((window) => ({
      mentor_id: mentorId,
      weekday: window.weekday,
      start_minute: window.startMinute,
      end_minute: window.endMinute,
    })),
  );
  assertWrite(inserted);
}

function asLoaded(data: Record<string, unknown> | null): LoadedApplication | null {
  if (!data || typeof data.id !== 'string' || typeof data.status !== 'string') return null;
  return data as unknown as LoadedApplication;
}

export async function listAdminExpertApplications(): Promise<AdminExpertApplicationSummary[]> {
  const listed = await (applications()
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(50) as unknown as Promise<QueryResult<ListRow[] | null>>);

  if (listed.error) throw new Error('Could not load applications.');

  return (listed.data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    employer: row.employer,
    hourlyRateCents: row.hourly_rate_cents,
    services: row.services ?? [],
    status: row.status,
    createdAt: row.created_at,
    isCivilServant: row.is_civil_servant === true,
  }));
}

function claimedIds(result: QueryResult<Array<{ id: string }> | null>): string[] {
  if (!Array.isArray(result.data)) return [];
  return result.data.map((row) => row.id).filter((id) => id.length > 0);
}

async function claimSubmitted(
  id: string,
  patch: Record<string, unknown>,
): Promise<QueryResult<Array<{ id: string }> | null>> {
  return applications().update(patch).eq('id', id).eq('status', 'submitted').select('id');
}

type CreatedMentor = { id: string; created: boolean };

async function rollbackHalfApproved(id: string, mentor: CreatedMentor | undefined): Promise<void> {
  if (mentor?.created) {
    assertWrite(await mentorWrite('mentors').delete().eq('id', mentor.id));
  }
  const reverted = await applications()
    .update({ status: 'submitted', mentor_id: null })
    .eq('id', id)
    .eq('status', 'approved')
    .select('id');
  if (reverted.error) throw new Error(REVIEW_FAILED);
}

export async function reviewExpertApplication(
  id: string,
  decision: 'approve' | 'decline',
): Promise<ReviewExpertApplicationResult> {
  const loaded = await applications().select(DETAIL_COLUMNS).eq('id', id).maybeSingle();
  if (loaded.error) throw new Error(REVIEW_FAILED);

  const application = asLoaded(loaded.data);
  if (!application) {
    return { ok: false, status: 404, error: 'Application not found.' };
  }
  if (application.status !== 'submitted') {
    return { ok: false, status: 409, error: 'Already reviewed.' };
  }

  if (decision === 'decline') {
    const declined = await claimSubmitted(id, { status: 'declined' });
    assertWrite(declined);
    if (claimedIds(declined).length === 0) {
      return { ok: false, status: 409, error: 'Already reviewed.' };
    }
    return { ok: true };
  }

  const email = normalizeEmail(application.email);
  const existingMentor = await mentorIdByEmail(email);
  if (existingMentor.error) throw new Error(REVIEW_FAILED);
  if (existingMentor.data?.id) {
    return { ok: false, status: 409, error: 'An expert with this email already exists.' };
  }

  // Claim before insert so a second approve cannot create or overwrite a mentor.
  const claimed = await claimSubmitted(id, { status: 'approved' });
  assertWrite(claimed);
  if (claimedIds(claimed).length === 0) {
    return { ok: false, status: 409, error: 'Already reviewed.' };
  }

  let mentor: CreatedMentor | undefined;
  try {
    mentor = await createUnlistedMentor(application);
    await copyOfferOntoMentor(mentor.id, application);
  } catch (error) {
    await rollbackHalfApproved(id, mentor);
    throw error;
  }

  let linked: QueryResult<Array<{ id: string }> | null>;
  try {
    linked = await applications()
      .update({ mentor_id: mentor.id })
      .eq('id', id)
      .eq('status', 'approved')
      .select('id');
  } catch (error) {
    if (mentor.created) await rollbackHalfApproved(id, mentor);
    throw error;
  }

  if (!linked.error && claimedIds(linked).length > 0) {
    return { ok: true, mentorId: mentor.id };
  }

  if (mentor.created) {
    await rollbackHalfApproved(id, mentor);
    throw new Error(REVIEW_FAILED);
  }

  if (linked.error) throw new Error(REVIEW_FAILED);
  return { ok: false, status: 409, error: 'Already reviewed.' };
}
