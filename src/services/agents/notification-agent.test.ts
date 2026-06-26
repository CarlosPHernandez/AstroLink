import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockDeliveryMaybeSingle = vi.hoisted(() => vi.fn());
const mockDeliveryInsert = vi.hoisted(() => vi.fn());
const mockAuditInsert = vi.hoisted(() => vi.fn());
const mockEmailSender = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockBookingSingle })),
          })),
        };
      }
      if (table === 'notification_deliveries') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({ maybeSingle: mockDeliveryMaybeSingle })),
              })),
            })),
          })),
          insert: mockDeliveryInsert,
        };
      }
      if (table === 'audit_log') {
        return { insert: mockAuditInsert };
      }
      return { select: vi.fn() };
    }),
  },
}));

import { NotificationAgent } from '@/services/agents/notification-agent';

const bookingRow = {
  id: 'booking-1',
  scheduled_at: '2026-07-01T18:00:00.000Z',
  service_type: 'session_1on1',
  match_reason: 'Learn about cubesat propulsion',
  briefing_json: { session_objectives: ['Discuss thruster options'] },
  daily_room_url: 'https://daily.example/room',
  users: { full_name: 'Carlos', email: 'carlos@example.com' },
  mentors: { full_name: 'Chris', email: 'chris@example.com' },
};

describe('NotificationAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookingSingle.mockResolvedValue({ data: bookingRow, error: null });
    mockDeliveryMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockDeliveryInsert.mockResolvedValue({ error: null });
    mockAuditInsert.mockResolvedValue({ error: null });
    mockEmailSender.mockResolvedValue({ ok: true, messageId: 'msg-1' });
    delete process.env.NOTIFICATIONS_DISABLED;
  });

  afterEach(() => {
    delete process.env.NOTIFICATIONS_DISABLED;
  });

  it('skips all sends when notifications are disabled', async () => {
    process.env.NOTIFICATIONS_DISABLED = 'true';
    const agent = new NotificationAgent(mockEmailSender);

    await agent.sendBookingConfirmations('booking-1');

    expect(mockEmailSender).not.toHaveBeenCalled();
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_id: 'APX-08',
        event: 'NOTIFICATION_SKIPPED',
      }),
    );
  });

  it('sends mentee and mentor emails on first fulfillment', async () => {
    const agent = new NotificationAgent(mockEmailSender);

    await agent.sendBookingConfirmations('booking-1');

    expect(mockEmailSender).toHaveBeenCalledTimes(2);
    expect(mockDeliveryInsert).toHaveBeenCalledTimes(2);
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'NOTIFICATION_SENT' }),
    );
  });

  it('skips recipient when delivery row already exists', async () => {
    mockDeliveryMaybeSingle.mockResolvedValue({ data: { id: 'existing' }, error: null });
    const agent = new NotificationAgent(mockEmailSender);

    await agent.sendBookingConfirmations('booking-1');

    expect(mockEmailSender).not.toHaveBeenCalled();
  });

  it('records failed send without throwing', async () => {
    mockEmailSender.mockResolvedValue({ ok: false, error: 'Resend 422' });
    const agent = new NotificationAgent(mockEmailSender);

    await expect(agent.sendBookingConfirmations('booking-1')).resolves.toBeUndefined();

    expect(mockDeliveryInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error_message: 'Resend 422',
      }),
    );
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'NOTIFICATION_FAILED' }),
    );
  });

  it('skips mentee with missing email but still sends mentor', async () => {
    mockBookingSingle.mockResolvedValue({
      data: {
        ...bookingRow,
        users: { full_name: 'Carlos', email: '' },
      },
      error: null,
    });

    const agent = new NotificationAgent(mockEmailSender);
    await agent.sendBookingConfirmations('booking-1');

    expect(mockEmailSender).toHaveBeenCalledTimes(1);
    expect(mockEmailSender.mock.calls[0][0].to).toBe('chris@example.com');
  });
});