import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireMentorSession = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/mentor-activation/require-activated-mentor', () => ({
  requireMentorSession: () => mockRequireMentorSession(),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const mentorUserId = 'a0000002-0000-4000-8000-000000000002';

const validBody = {
  mentorId: 'someone-else',
  hourlyRateDollars: 150,
  services: ['session_1on1'],
  videoRequest: { enabled: false },
  timezone: 'America/Chicago',
  windows: [{ weekday: 2, startMinute: 9 * 60, endMinute: 12 * 60 }],
};

function patchRequest(body: unknown = validBody) {
  return new Request('http://127.0.0.1:3000/api/mentor/offer', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/mentor/offer', () => {
  beforeEach(() => {
    mockRequireMentorSession.mockReset();
    mockFrom.mockReset();
  });

  it('falls back to America/Chicago and an empty window list', async () => {
    mockRequireMentorSession.mockResolvedValue({
      ok: true,
      session: {
        userId: mentorUserId,
        role: 'mentor',
        email: 'chris@astrolink.ai',
        fullName: 'Chris Sembroski',
      },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'mentors') {
        return {
          select: () => ({
            eq: (_column: string, value: string) => {
              expect(value).toBe(mentorUserId);
              return {
                maybeSingle: async () => ({
                  data: {
                    live_session_price_cents: 15000,
                    offered_services: ['session_1on1'],
                    video_requests_enabled: false,
                    video_request_price_cents: 0,
                    video_request_sla_days: 7,
                    timezone: null,
                  },
                  error: null,
                }),
              };
            },
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
      };
    });

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      hourlyRateDollars: 150,
      services: ['session_1on1'],
      videoRequest: { enabled: false },
      timezone: 'America/Chicago',
      windows: [],
    });
  });
});

describe('PATCH /api/mentor/offer', () => {
  beforeEach(() => {
    mockRequireMentorSession.mockReset();
    mockFrom.mockReset();
  });

  it('rejects a mentee and does not write', async () => {
    mockRequireMentorSession.mockResolvedValue({
      ok: false,
      message: 'You must be signed in as a mentor.',
    });

    const { PATCH } = await import('./route');
    const response = await PATCH(patchRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'You must be signed in as a mentor.',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('writes 15000 cents for rate 150, omits is_listed, and replaces only this mentor windows', async () => {
    mockRequireMentorSession.mockResolvedValue({
      ok: true,
      session: {
        userId: mentorUserId,
        role: 'mentor',
        email: 'chris@astrolink.ai',
        fullName: 'Chris Sembroski',
      },
    });

    const mentorEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const mentorUpdate = vi.fn(() => ({ eq: mentorEq }));
    const windowDeleteEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const windowInsert = vi.fn().mockResolvedValue({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'mentors') {
        return { update: mentorUpdate };
      }
      if (table === 'mentor_availability_windows') {
        return {
          delete: () => ({ eq: windowDeleteEq }),
          insert: windowInsert,
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { PATCH } = await import('./route');
    const response = await PATCH(patchRequest());

    expect(response.status).toBe(200);
    expect(mentorUpdate).toHaveBeenCalledTimes(1);
    const update = mentorUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(update.live_session_price_cents).toBe(15000);
    expect(update).not.toHaveProperty('is_listed');
    expect(update).not.toHaveProperty('compliance_status');
    expect(mentorEq).toHaveBeenCalledWith('id', mentorUserId);
    expect(windowDeleteEq).toHaveBeenCalledWith('mentor_id', mentorUserId);
    expect(windowInsert).toHaveBeenCalledWith([
      {
        mentor_id: mentorUserId,
        weekday: 2,
        start_minute: 540,
        end_minute: 720,
      },
    ]);
  });
});
