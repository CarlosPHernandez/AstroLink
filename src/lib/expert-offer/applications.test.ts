import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpertApplicationSchema, type ExpertApplication } from '@/lib/expert-offer/schema';

const mockFrom = vi.hoisted(() => vi.fn());
const mockCreateOrUpdateMentor = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/lib/admin-create-mentor', () => ({
  createOrUpdateMentor: (...args: unknown[]) => mockCreateOrUpdateMentor(...args),
}));

import { reviewExpertApplication, submitExpertApplication } from '@/lib/expert-offer/applications';

const base = {
  fullName: 'Avery Quinn',
  email: 'avery@example.com',
  employer: 'JSC',
  expertise: 'Guidance, navigation',
  bio: 'Ten years on crewed vehicle guidance.',
  hourlyRateDollars: 150,
  services: ['session_1on1'],
  videoRequest: { enabled: false },
  timezone: 'America/Chicago',
  windows: [{ weekday: 2, startMinute: 9 * 60, endMinute: 12 * 60 }],
  isCivilServant: false,
};

function application(overrides: Partial<ExpertApplication> = {}): ExpertApplication {
  return ExpertApplicationSchema.parse({ ...base, ...overrides });
}

function lookupBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
  };
  return builder;
}

function insertBuilder() {
  const chain = {
    select: vi.fn(() => chain),
    single: vi.fn(),
  };
  return chain;
}

describe('submitExpertApplication', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('inserts a mapped row and returns the new id when no submitted application exists', async () => {
    const lookup = lookupBuilder();
    lookup.maybeSingle.mockResolvedValue({ data: null, error: null });
    const inserted = insertBuilder();
    inserted.single.mockResolvedValue({ data: { id: 'new-id' }, error: null });
    const lookupQuery = { ...lookup, insert: vi.fn(() => inserted) };
    mockFrom.mockReturnValueOnce(lookup).mockReturnValueOnce(lookupQuery);

    const result = await submitExpertApplication(application({ email: 'Avery@Example.com' }));

    expect(result).toEqual({ id: 'new-id', created: true });
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'expert_applications');
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'expert_applications');
    expect(lookup.eq).toHaveBeenNthCalledWith(1, 'email', 'avery@example.com');
    expect(lookup.eq).toHaveBeenNthCalledWith(2, 'status', 'submitted');
    expect(lookupQuery.insert).toHaveBeenCalledWith({
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
      is_civil_servant: false,
      status: 'submitted',
    });
    expect(mockFrom.mock.calls.every((call) => call[0] === 'expert_applications')).toBe(true);
  });

  it('returns the existing submitted id and does not insert', async () => {
    const lookup = lookupBuilder();
    lookup.maybeSingle.mockResolvedValue({ data: { id: 'existing-id' }, error: null });
    mockFrom.mockReturnValue(lookup);

    const result = await submitExpertApplication({
      ...application(),
      email: '  Avery@Example.COM ',
    });

    expect(result).toEqual({ id: 'existing-id', created: false });
    expect(lookup.eq).toHaveBeenNthCalledWith(1, 'email', 'avery@example.com');
    expect(lookup.insert).not.toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('stores video price and SLA when a video review is offered', async () => {
    const lookup = lookupBuilder();
    lookup.maybeSingle.mockResolvedValue({ data: null, error: null });
    const inserted = insertBuilder();
    inserted.single.mockResolvedValue({ data: { id: 'video-id' }, error: null });
    const lookupQuery = { ...lookup, insert: vi.fn(() => inserted) };
    mockFrom.mockReturnValueOnce(lookup).mockReturnValueOnce(lookupQuery);

    await submitExpertApplication(
      application({
        services: [],
        videoRequest: { enabled: true, priceCents: 2500, slaDays: 5 },
      }),
    );

    expect(lookupQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [],
        video_requests_enabled: true,
        video_request_price_cents: 2500,
        video_request_sla_days: 5,
        hourly_rate_cents: 15000,
      }),
    );
  });

  it('throws and does not insert when the duplicate lookup fails', async () => {
    const lookup = lookupBuilder();
    lookup.maybeSingle.mockResolvedValue({ data: null, error: { message: 'db down' } });
    mockFrom.mockReturnValue(lookup);

    await expect(submitExpertApplication(application())).rejects.toThrow(
      'Could not submit. Try again.',
    );
    expect(lookup.insert).not.toHaveBeenCalled();
  });

  it('returns created false when a concurrent insert hits the submitted-email unique index', async () => {
    const lookup = lookupBuilder();
    lookup.maybeSingle.mockResolvedValue({ data: null, error: null });
    const inserted = insertBuilder();
    inserted.single.mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "expert_applications_one_submitted_email"',
      },
    });
    const reread = lookupBuilder();
    reread.maybeSingle.mockResolvedValue({ data: { id: 'existing-id' }, error: null });
    const lookupQuery = { ...lookup, insert: vi.fn(() => inserted) };
    mockFrom.mockReturnValueOnce(lookup).mockReturnValueOnce(lookupQuery).mockReturnValueOnce(reread);

    await expect(submitExpertApplication(application())).resolves.toEqual({
      id: 'existing-id',
      created: false,
    });
    expect(lookupQuery.insert).toHaveBeenCalledTimes(1);
  });

  it('throws when insert fails', async () => {
    const lookup = lookupBuilder();
    lookup.maybeSingle.mockResolvedValue({ data: null, error: null });
    const inserted = insertBuilder();
    inserted.single.mockResolvedValue({ data: null, error: { message: 'db down' } });
    const lookupQuery = { ...lookup, insert: vi.fn(() => inserted) };
    mockFrom.mockReturnValueOnce(lookup).mockReturnValueOnce(lookupQuery);

    await expect(submitExpertApplication(application())).rejects.toThrow(
      'Could not submit. Try again.',
    );
  });
});

const APP_ID = '00000000-0000-4000-8000-000000000010';

function submittedApplicationRow() {
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
    status: 'submitted',
    is_civil_servant: false,
  };
}

function selectMaybeSingle(data: Record<string, unknown> | null) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data, error: null })),
  };
  return builder;
}

function applicationUpdate(result: { data: Array<{ id: string }> | null; error: { message: string } | null }) {
  const chain = {
    eq: vi.fn(() => chain),
    select: vi.fn(async () => result),
  };
  return { update: vi.fn(() => chain), chain };
}

describe('reviewExpertApplication', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockCreateOrUpdateMentor.mockReset();
  });

  it('rolls back a created mentor when the offer write fails', async () => {
    const loaded = selectMaybeSingle(submittedApplicationRow());
    const emailLookup = selectMaybeSingle(null);
    const claimed = applicationUpdate({ data: [{ id: APP_ID }], error: null });
    const offerEq = vi.fn(async () => ({ data: null, error: { message: 'offer write failed' } }));
    const deletedEq = vi.fn(async () => ({ data: null, error: null }));
    const reverted = applicationUpdate({ data: [{ id: APP_ID }], error: null });
    mockCreateOrUpdateMentor.mockResolvedValue({
      id: 'mentor-new',
      email: 'avery@example.com',
      fullName: 'Avery Quinn',
      slug: 'avery-quinn',
      liveSessionPriceCents: 15000,
      isListed: false,
      complianceStatus: 'approved',
      bookHref: '/booking?mentor=avery-quinn',
      created: true,
    });
    mockFrom
      .mockReturnValueOnce(loaded)
      .mockReturnValueOnce(emailLookup)
      .mockReturnValueOnce(claimed)
      .mockReturnValueOnce({ update: vi.fn(() => ({ eq: offerEq })) })
      .mockReturnValueOnce({ delete: vi.fn(() => ({ eq: deletedEq })) })
      .mockReturnValueOnce(reverted);

    await expect(reviewExpertApplication(APP_ID, 'approve')).rejects.toThrow(
      'Could not review application.',
    );

    expect(mockCreateOrUpdateMentor).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenNthCalledWith(5, 'mentors');
    expect(deletedEq).toHaveBeenCalledWith('id', 'mentor-new');
    expect(reverted.update).toHaveBeenCalledWith({ status: 'submitted', mentor_id: null });
    expect(reverted.chain.eq).toHaveBeenNthCalledWith(1, 'id', APP_ID);
    expect(reverted.chain.eq).toHaveBeenNthCalledWith(2, 'status', 'approved');
  });
});
