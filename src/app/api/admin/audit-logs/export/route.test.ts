import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mockRequireApiRole = vi.hoisted(() => vi.fn());
const mockFetchLlmDecisionLogs = vi.hoisted(() => vi.fn());
const mockFormatXprizeDecisionExport = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock('@/lib/xprize-decision-logs', () => ({
  fetchLlmDecisionLogs: (...args: unknown[]) => mockFetchLlmDecisionLogs(...args),
  formatXprizeDecisionExport: (...args: unknown[]) => mockFormatXprizeDecisionExport(...args),
}));

const adminSession = {
  userId: 'a0000003-0000-4000-8000-000000000003',
  role: 'admin' as const,
  email: 'admin@astrolink.ai',
  fullName: 'Flight Command',
  onboarded: true,
};

describe('GET /api/admin/audit-logs/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireApiRole.mockResolvedValue(adminSession);
    mockFetchLlmDecisionLogs.mockResolvedValue([]);
    mockFormatXprizeDecisionExport.mockReturnValue({
      exported_at: '2026-07-01T12:00:00.000Z',
      schema_version: 't8-v1',
      decision_count: 0,
      decisions: [],
    });
  });

  it('returns attachment JSON for admin', async () => {
    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost/api/admin/audit-logs/export?limit=10'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toContain('astrolink-xprize-decisions');
    expect(mockFetchLlmDecisionLogs).toHaveBeenCalledWith({ limit: 10, since: undefined });
    const body = await response.json();
    expect(body.schema_version).toBe('t8-v1');
  });

  it('rejects non-admin', async () => {
    mockRequireApiRole.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost/api/admin/audit-logs/export'));
    expect(response.status).toBe(403);
  });
});