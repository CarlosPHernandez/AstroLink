import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
import {
  fetchLlmDecisionLogs,
  formatXprizeDecisionExport,
} from '@/lib/xprize-decision-logs';

/**
 * XPRIZE T8 — structured Gemini decision log export for judges.
 * GET /api/admin/audit-logs/export?limit=500&since=2026-01-01T00:00:00Z
 */
export async function GET(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '500') || 500, 2000);
    const since = searchParams.get('since') ?? undefined;

    const rows = await fetchLlmDecisionLogs({ limit, since });
    const exportPayload = formatXprizeDecisionExport(rows);
    const filename = `astrolink-xprize-decisions-${exportPayload.exported_at.slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}