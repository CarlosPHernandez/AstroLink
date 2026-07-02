import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
import { fetchRecentAuditLogs } from '@/lib/xprize-decision-logs';

export async function GET(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '100') || 100, 500);
    const logs = await fetchRecentAuditLogs(limit);

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Audit logs failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}