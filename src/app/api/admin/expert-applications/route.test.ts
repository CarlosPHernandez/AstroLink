import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockCreateOrUpdateMentor = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock('@/lib/admin-create-mentor', () => ({
  createOrUpdateMentor: (...args: unknown[]) => mockCreateOrUpdateMentor(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { GET, POST } from './route';

const APP_ID = '00000000-0000-4000-8000-000000000010';
const MISSING_ID = '00000000-0000-4000-8000-000000000099';

type QueryCall = {
  table: string;
  op: 'select' | 'update' | 'delete' | 'insert';
  columns?: string;
  filters: Array<[string, unknown]>;
  order?: { column: string; ascending: boolean };
  limit?: number;
  payload?: unknown;
};

type QueryResult = { data: unknown; error: { message: string } | null };

function applicationRow(status: string) {
  return {
    id: APP_ID,
    full_name: 'Avery Quinn',
    email: 'avery@example.com',
    employer: 'JSC',
    expertise: 'Guidance, navigation',
    bio: 'Ten years on crewed vehicle guidance.',
    hourly_rate_cents: 15000,
    services: ['session_1on1'],
    video_requests_enabled: false,
    video_request_price_cents: 0,
    video_request_sla_days: 7,
    timezone: 'America/Chicago',
    windows: [{ weekday: 2, startMinute: 540, endMinute: 720 }],
    status,
    is_civil_servant: false,
    created_at: '2026-09-24T15:00:00.000Z',
  };
}

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/expert-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/admin/expert-applications', () => {
  let row = applicationRow('submitted');
  let calls: QueryCall[] = [];
  let existingMentorEmail: string | null = null;

  function dispatch(call: QueryCall): QueryResult {
    if (call.table === 'expert_applications' && call.op === 'select') {
      const id = call.filters.find(([column]) => column === 'id')?.[1];
      if (id) {
        if (id !== row.id) return { data: null, error: null };
        return { data: { ...row, windows: [...row.windows] }, error: null };
      }
      return {
        data: [
          {
            id: row.id,
            full_name: row.full_name,
            email: row.email,
            employer: row.employer,
            hourly_rate_cents: row.hourly_rate_cents,
            services: row.services,
            status: row.status,
            created_at: row.created_at,
            is_civil_servant: row.is_civil_servant,
            bio: row.bio,
          },
        ],
        error: null,
      };
    }

    if (call.table === 'expert_applications' && call.op === 'update') {
      const id = call.filters.find(([column]) => column === 'id')?.[1];
      const requiredStatus = call.filters.find(([column]) => column === 'status')?.[1];
      const matches = id === row.id && (requiredStatus === undefined || requiredStatus === row.status);
      if (!matches) return { data: [], error: null };
      Object.assign(row, call.payload);
      return { data: [{ id: row.id }], error: null };
    }

    if (call.table === 'mentors' && call.op === 'select') {
      const email = call.filters.find(([column]) => column === 'email')?.[1];
      if (existingMentorEmail && email === existingMentorEmail) {
        return { data: { id: 'mentor-live' }, error: null };
      }
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }

  function builder(table: string) {
    const call: QueryCall = { table, op: 'select', filters: [] };
    const finish = () => {
      const snapshot: QueryCall = {
        ...call,
        filters: [...call.filters],
      };
      calls.push(snapshot);
      return Promise.resolve(dispatch(snapshot));
    };
    const chain = {
      select: (columns: string) => {
        call.columns = columns;
        if (call.op !== 'update') call.op = 'select';
        return chain;
      },
      eq: (column: string, value: unknown) => {
        call.filters.push([column, value]);
        return chain;
      },
      order: (column: string, options: { ascending: boolean }) => {
        call.order = { column, ascending: options.ascending };
        return chain;
      },
      limit: (count: number) => {
        call.limit = count;
        return chain;
      },
      maybeSingle: () => finish(),
      update: (payload: unknown) => {
        call.op = 'update';
        call.payload = payload;
        return chain;
      },
      delete: () => {
        call.op = 'delete';
        return chain;
      },
      insert: (payload: unknown) => {
        call.op = 'insert';
        call.payload = payload;
        return finish();
      },
      then: (
        resolve: (value: QueryResult) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => finish().then(resolve, reject),
    };
    return chain;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    row = applicationRow('submitted');
    calls = [];
    existingMentorEmail = null;
    mockRequireApiRole.mockResolvedValue({ userId: 'admin-1', role: 'admin' });
    mockFrom.mockImplementation((table: string) => builder(table));
    mockCreateOrUpdateMentor.mockImplementation(async (input: { slug: string; email: string; fullName: string; liveSessionPriceCents: number; isListed: boolean }) => ({
      id: 'mentor-1',
      email: input.email,
      fullName: input.fullName,
      slug: input.slug,
      liveSessionPriceCents: input.liveSessionPriceCents,
      isListed: input.isListed,
      complianceStatus: 'approved',
      bookHref: `/booking?mentor=${input.slug}`,
      created: true,
    }));
  });

  it('rejects an unauthenticated POST', async () => {
    mockRequireApiRole.mockResolvedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    );

    const response = await POST(makeRequest({ id: APP_ID, decision: 'approve' }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Unauthorized' });
    expect(mockRequireApiRole).toHaveBeenCalledWith('admin');
    expect(mockCreateOrUpdateMentor).not.toHaveBeenCalled();
  });

  it('rejects a mentor session', async () => {
    mockRequireApiRole.mockResolvedValue(
      NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    );

    const response = await POST(makeRequest({ id: APP_ID, decision: 'approve' }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Forbidden' });
    expect(mockCreateOrUpdateMentor).not.toHaveBeenCalled();
  });

  it('declines without creating a mentor', async () => {
    const response = await POST(makeRequest({ id: APP_ID, decision: 'decline' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockCreateOrUpdateMentor).not.toHaveBeenCalled();
    expect(calls.filter((call) => call.table === 'mentors' || call.table === 'mentor_availability_windows')).toEqual([]);
    expect(calls).toContainEqual(
      expect.objectContaining({
        table: 'expert_applications',
        op: 'update',
        payload: { status: 'declined' },
      }),
    );
    expect(row.status).toBe('declined');
  });

  it('approves into an unlisted mentor using the application cents', async () => {
    const response = await POST(makeRequest({ id: APP_ID, decision: 'approve' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, mentorId: 'mentor-1' });
    expect(mockCreateOrUpdateMentor).toHaveBeenCalledTimes(1);
    const input = mockCreateOrUpdateMentor.mock.calls[0][0] as Record<string, unknown>;
    expect(input).toEqual({
      email: 'avery@example.com',
      fullName: 'Avery Quinn',
      slug: 'avery-quinn',
      employer: 'JSC',
      expertise: ['Guidance', 'navigation'],
      bio: 'Ten years on crewed vehicle guidance.',
      liveSessionPriceCents: 15000,
      isListed: false,
    });
    expect(input).not.toHaveProperty('complianceStatus');
    expect(input).not.toHaveProperty('offered_services');
    expect(calls).toContainEqual(
      expect.objectContaining({
        table: 'mentors',
        op: 'update',
        payload: {
          offered_services: ['session_1on1'],
          video_requests_enabled: false,
          video_request_price_cents: 0,
          video_request_sla_days: 7,
          timezone: 'America/Chicago',
        },
        filters: [['id', 'mentor-1']],
      }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({
        table: 'mentor_availability_windows',
        op: 'delete',
        filters: [['mentor_id', 'mentor-1']],
      }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({
        table: 'mentor_availability_windows',
        op: 'insert',
        payload: [
          {
            mentor_id: 'mentor-1',
            weekday: 2,
            start_minute: 540,
            end_minute: 720,
          },
        ],
      }),
    );
    expect(row.status).toBe('approved');
    expect(row).toMatchObject({ mentor_id: 'mentor-1' });
    expect(calls).toContainEqual(
      expect.objectContaining({
        table: 'expert_applications',
        op: 'update',
        payload: { status: 'approved' },
        filters: [
          ['id', APP_ID],
          ['status', 'submitted'],
        ],
      }),
    );
  });

  it('returns 409 and does not write a mentor when the email already exists', async () => {
    existingMentorEmail = 'avery@example.com';

    const response = await POST(makeRequest({ id: APP_ID, decision: 'approve' }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'An expert with this email already exists.',
    });
    expect(mockCreateOrUpdateMentor).not.toHaveBeenCalled();
    expect(calls.filter((call) => call.table === 'mentor_availability_windows')).toEqual([]);
    expect(calls.filter((call) => call.table === 'mentors' && call.op !== 'select')).toEqual([]);
    expect(row.status).toBe('submitted');
  });

  it('passes document_required when the applicant is a civil servant', async () => {
    row = { ...applicationRow('submitted'), is_civil_servant: true };

    const response = await POST(makeRequest({ id: APP_ID, decision: 'approve' }));

    expect(response.status).toBe(200);
    expect(mockCreateOrUpdateMentor).toHaveBeenCalledWith(
      expect.objectContaining({
        isListed: false,
        complianceStatus: 'document_required',
      }),
    );
  });

  it('returns 409 when the application was already reviewed', async () => {
    const first = await POST(makeRequest({ id: APP_ID, decision: 'approve' }));
    expect(first.status).toBe(200);

    const second = await POST(makeRequest({ id: APP_ID, decision: 'approve' }));

    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toEqual({ success: false, error: 'Already reviewed.' });
    expect(mockCreateOrUpdateMentor).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when the application id is missing', async () => {
    const response = await POST(makeRequest({ id: MISSING_ID, decision: 'approve' }));

    expect(response.status).toBe(404);
    expect(mockCreateOrUpdateMentor).not.toHaveBeenCalled();
  });

  it('lists the newest applications without bio', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      applications: [
        {
          id: APP_ID,
          fullName: 'Avery Quinn',
          email: 'avery@example.com',
          employer: 'JSC',
          hourlyRateCents: 15000,
          services: ['session_1on1'],
          status: 'submitted',
          createdAt: '2026-09-24T15:00:00.000Z',
          isCivilServant: false,
        },
      ],
    });
    expect(calls).toContainEqual(
      expect.objectContaining({
        table: 'expert_applications',
        op: 'select',
        columns:
          'id, full_name, email, employer, hourly_rate_cents, services, status, created_at, is_civil_servant',
        order: { column: 'created_at', ascending: false },
        limit: 50,
      }),
    );
  });

  it('retries once with a numeric slug suffix when the name slug is taken', async () => {
    mockCreateOrUpdateMentor.mockImplementation(async (input: { slug: string }) => {
      if (input.slug === 'avery-quinn') {
        throw new Error('Slug "avery-quinn" is already used by another mentor.');
      }
      return {
        id: 'mentor-2',
        email: 'avery@example.com',
        fullName: 'Avery Quinn',
        slug: input.slug,
        liveSessionPriceCents: 15000,
        isListed: false,
        complianceStatus: 'approved',
        bookHref: '/booking?mentor=avery-quinn-2',
        created: true,
      };
    });

    const response = await POST(makeRequest({ id: APP_ID, decision: 'approve' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, mentorId: 'mentor-2' });
    expect(mockCreateOrUpdateMentor).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ slug: 'avery-quinn', isListed: false, liveSessionPriceCents: 15000 }),
    );
    expect(mockCreateOrUpdateMentor).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ slug: 'avery-quinn-2', isListed: false }),
    );
  });
});
