import 'server-only';

import type { MentorOffer } from '@/lib/expert-offer/schema';
import { supabaseAdmin } from '@/lib/supabase';

const LOAD_FAILED = 'Could not load offer.';
const SAVE_FAILED = 'Could not save offer.';
const DEFAULT_TIMEZONE = 'America/Chicago';

type DbError = { message: string };

type QueryResult<T> = {
  data: T;
  error: DbError | null;
};

type MentorOfferRow = {
  live_session_price_cents: number;
  offered_services: string[] | null;
  video_requests_enabled: boolean;
  video_request_price_cents: number;
  video_request_sla_days: number;
  timezone: string | null;
};

type WindowRow = {
  weekday: number;
  start_minute: number;
  end_minute: number;
};

type MentorFilter = {
  eq: (column: string, value: string) => {
    maybeSingle: () => Promise<QueryResult<MentorOfferRow | null>>;
  };
};

type MentorQuery = {
  select: (columns: string) => MentorFilter;
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => Promise<QueryResult<null>>;
  };
};

type WindowList = PromiseLike<QueryResult<WindowRow[] | null>>;

type WindowIdRow = { id: string };

type DeleteEq = Promise<QueryResult<null>> & {
  not: (column: string, operator: string, value: string) => Promise<QueryResult<null>>;
};

type WindowQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => WindowList;
  };
  delete: () => {
    eq: (column: string, value: string) => DeleteEq;
  };
  insert: (rows: Record<string, unknown>[]) => {
    select: (columns: string) => Promise<QueryResult<WindowIdRow[] | null>>;
  };
};

const MENTOR_COLUMNS =
  'live_session_price_cents, offered_services, video_requests_enabled, video_request_price_cents, video_request_sla_days, timezone';

export type StoredMentorOffer = {
  hourlyRateDollars: number;
  services: MentorOffer['services'];
  videoRequest: MentorOffer['videoRequest'];
  timezone: string;
  windows: MentorOffer['windows'];
};

function mentors(): MentorQuery {
  // offered_services and timezone are not in database.types.ts yet.
  const client = supabaseAdmin as unknown as {
    from: (table: 'mentors') => MentorQuery;
  };
  return client.from('mentors');
}

function availabilityWindows(): WindowQuery {
  // mentor_availability_windows is not in database.types.ts yet.
  const client = supabaseAdmin as unknown as {
    from: (table: 'mentor_availability_windows') => WindowQuery;
  };
  return client.from('mentor_availability_windows');
}

function assertWrite(result: QueryResult<unknown>): void {
  if (result.error) throw new Error(SAVE_FAILED);
}

function videoColumns(offer: MentorOffer): {
  video_requests_enabled: boolean;
  video_request_price_cents: number;
  video_request_sla_days: number;
} {
  if (!offer.videoRequest.enabled) {
    return {
      video_requests_enabled: false,
      video_request_price_cents: 0,
      video_request_sla_days: 7,
    };
  }

  return {
    video_requests_enabled: true,
    video_request_price_cents: offer.videoRequest.priceCents,
    video_request_sla_days: offer.videoRequest.slaDays,
  };
}

function videoRequestFromRow(row: MentorOfferRow): MentorOffer['videoRequest'] {
  if (!row.video_requests_enabled) return { enabled: false };
  return {
    enabled: true,
    priceCents: row.video_request_price_cents,
    slaDays: row.video_request_sla_days,
  };
}

function windowsFromRows(rows: WindowRow[] | null): MentorOffer['windows'] {
  return (rows ?? [])
    .map((row) => ({
      weekday: row.weekday,
      startMinute: row.start_minute,
      endMinute: row.end_minute,
    }))
    .sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);
}

export async function getMentorOffer(mentorId: string): Promise<StoredMentorOffer | null> {
  const loaded = await mentors().select(MENTOR_COLUMNS).eq('id', mentorId).maybeSingle();
  if (loaded.error) throw new Error(LOAD_FAILED);
  if (!loaded.data) return null;

  const listed = await availabilityWindows()
    .select('weekday, start_minute, end_minute')
    .eq('mentor_id', mentorId);
  if (listed.error) throw new Error(LOAD_FAILED);

  const row = loaded.data;
  return {
    hourlyRateDollars: Math.round(row.live_session_price_cents / 100),
    services: (row.offered_services ?? []) as MentorOffer['services'],
    videoRequest: videoRequestFromRow(row),
    timezone: row.timezone?.trim() || DEFAULT_TIMEZONE,
    windows: windowsFromRows(listed.data),
  };
}

export async function saveMentorOffer(mentorId: string, offer: MentorOffer): Promise<void> {
  const updated = await mentors()
    .update({
      live_session_price_cents: offer.hourlyRateDollars * 100,
      offered_services: offer.services,
      ...videoColumns(offer),
      timezone: offer.timezone,
    })
    .eq('id', mentorId);
  assertWrite(updated);

  if (offer.windows.length === 0) {
    const deleted = await availabilityWindows().delete().eq('mentor_id', mentorId);
    assertWrite(deleted);
    return;
  }

  const inserted = await availabilityWindows()
    .insert(
      offer.windows.map((window) => ({
        mentor_id: mentorId,
        weekday: window.weekday,
        start_minute: window.startMinute,
        end_minute: window.endMinute,
      })),
    )
    .select('id');
  assertWrite(inserted);
  const ids = (inserted.data ?? []).map((row) => row.id);
  if (ids.length !== offer.windows.length) throw new Error(SAVE_FAILED);

  const deleted = await availabilityWindows()
    .delete()
    .eq('mentor_id', mentorId)
    .not('id', 'in', `(${ids.join(',')})`);
  assertWrite(deleted);
}
