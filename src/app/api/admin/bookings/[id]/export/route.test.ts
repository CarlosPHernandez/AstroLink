import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockFetchAdminBookingExportContext = vi.hoisted(() => vi.fn());
const mockFormatBookingExportMarkdown = vi.hoisted(() => vi.fn());
const mockBuildBookingExportFilename = vi.hoisted(() => vi.fn());
const mockRenderBookingBriefPdf = vi.hoisted(() => vi.fn());
const mockBuildBookingExportPdfFilename = vi.hoisted(() => vi.fn());
const mockSupabaseInsert = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock('@/lib/booking-export', () => ({
  fetchAdminBookingExportContext: (...args: unknown[]) =>
    mockFetchAdminBookingExportContext(...args),
  formatBookingExportMarkdown: (...args: unknown[]) =>
    mockFormatBookingExportMarkdown(...args),
  buildBookingExportFilename: (...args: unknown[]) =>
    mockBuildBookingExportFilename(...args),
}));

vi.mock('@/lib/booking-export-pdf', () => ({
  renderBookingBriefPdf: (...args: unknown[]) => mockRenderBookingBriefPdf(...args),
  buildBookingExportPdfFilename: (...args: unknown[]) =>
    mockBuildBookingExportPdfFilename(...args),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      insert: mockSupabaseInsert,
    }),
  },
}));

const adminSession = {
  userId: 'a0000003-0000-4000-8000-000000000003',
  role: 'admin' as const,
  email: 'admin@astrolink.ai',
  fullName: 'Flight Command',
  onboarded: true,
};

const bookingId = 'b0000001-0000-4000-8000-000000000001';

const exportContext = {
  id: bookingId,
  status: 'confirmed' as const,
  service_type: 'session_1on1' as const,
  scheduled_at: '2026-07-20T18:00:00.000Z',
  created_at: '2026-07-15T12:00:00.000Z',
  duration_minutes: 30,
  campaign_id: null,
  marketing_referrer: null,
  match_reason: 'Goals',
  intake_background: 'Background',
  briefing_json: null,
  menteeName: 'Alex',
  menteeEmail: 'alex@example.com',
  mentorName: 'Chris',
  transaction: null,
};

describe('GET /api/admin/bookings/[id]/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiRole.mockResolvedValue(adminSession);
    mockFetchAdminBookingExportContext.mockResolvedValue(exportContext);
    mockFormatBookingExportMarkdown.mockReturnValue('# AstroLink session brief — INTERNAL');
    mockBuildBookingExportFilename.mockReturnValue('astrolink-booking-brief-b0000001-2026-07-20.md');
    mockRenderBookingBriefPdf.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
    mockBuildBookingExportPdfFilename.mockReturnValue(
      'astrolink-session-prep-b0000001-2026-07-20.pdf',
    );
    mockSupabaseInsert.mockResolvedValue({ error: null });
  });

  it('returns markdown for admin and logs audit event', async () => {
    const { GET } = await import('./route');
    const response = await GET(
      new Request(`http://localhost/api/admin/bookings/${bookingId}/export`),
      { params: Promise.resolve({ id: bookingId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/markdown');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).toContain('INTERNAL');
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'BOOKING_EXPORT',
        ref_id: bookingId,
      }),
    );
  });

  it('returns pdf when format=pdf', async () => {
    const { GET } = await import('./route');
    const response = await GET(
      new Request(
        `http://localhost/api/admin/bookings/${bookingId}/export?format=pdf&download=1&includeEmail=false`,
      ),
      { params: Promise.resolve({ id: bookingId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('astrolink-session-prep');
    expect(mockRenderBookingBriefPdf).toHaveBeenCalledWith(
      exportContext,
      expect.objectContaining({ includeEmail: false }),
    );
  });

  it('sets attachment headers when download=1', async () => {
    const { GET } = await import('./route');
    const response = await GET(
      new Request(`http://localhost/api/admin/bookings/${bookingId}/export?download=1`),
      { params: Promise.resolve({ id: bookingId }) },
    );

    expect(response.headers.get('Content-Disposition')).toContain('astrolink-booking-brief');
  });

  it('rejects non-admin', async () => {
    mockRequireApiRole.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    const { GET } = await import('./route');
    const response = await GET(
      new Request(`http://localhost/api/admin/bookings/${bookingId}/export`),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid booking id', async () => {
    const { GET } = await import('./route');
    const response = await GET(
      new Request('http://localhost/api/admin/bookings/not-a-uuid/export'),
      { params: Promise.resolve({ id: 'not-a-uuid' }) },
    );
    expect(response.status).toBe(400);
  });

  it('returns 404 when booking is missing', async () => {
    mockFetchAdminBookingExportContext.mockResolvedValue(null);
    const { GET } = await import('./route');
    const response = await GET(
      new Request(`http://localhost/api/admin/bookings/${bookingId}/export`),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(response.status).toBe(404);
  });
});