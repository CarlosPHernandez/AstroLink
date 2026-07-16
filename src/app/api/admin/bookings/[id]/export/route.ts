import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiRole } from '@/lib/api-auth';
import {
  buildBookingExportFilename,
  fetchAdminBookingExportContext,
  formatBookingExportMarkdown,
} from '@/lib/booking-export';
import { supabaseAdmin } from '@/lib/supabase';

const BookingIdSchema = z.string().uuid();

function parseIncludeEmail(value: string | null): boolean {
  if (value === null) {
    return true;
  }
  const normalized = value.trim().toLowerCase();
  return normalized !== 'false' && normalized !== '0';
}

/**
 * Admin-only booking brief export for manual expert briefing.
 * GET /api/admin/bookings/[id]/export?includeEmail=true&download=1
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const { id: rawId } = await params;
  const parsedId = BookingIdSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: 'Invalid booking ID' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeEmail = parseIncludeEmail(searchParams.get('includeEmail'));
    const download = searchParams.get('download') === '1';

    const ctx = await fetchAdminBookingExportContext(parsedId.data);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const markdown = formatBookingExportMarkdown(ctx, { includeEmail });
    const filename = buildBookingExportFilename(ctx);

    await supabaseAdmin.from('audit_log').insert({
      agent_id: 'APX-04',
      event: 'BOOKING_EXPORT',
      ref_id: parsedId.data,
      payload: { includeEmail, download, admin_user_id: sessionOrResponse.userId },
    });

    const headers: Record<string, string> = {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    };

    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(markdown, { status: 200, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}