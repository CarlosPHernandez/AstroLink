import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiRole } from '@/lib/api-auth';
import {
  buildBookingExportFilename,
  fetchAdminBookingExportContext,
  formatBookingExportMarkdown,
} from '@/lib/booking-export';
import {
  buildBookingExportPdfFilename,
  renderBookingBriefPdf,
} from '@/lib/booking-export-pdf';
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
 * GET /api/admin/bookings/[id]/export?format=pdf&includeEmail=false&download=1
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
    const format = searchParams.get('format')?.trim().toLowerCase() ?? 'markdown';
    const includeEmail = parseIncludeEmail(searchParams.get('includeEmail'));
    const download = searchParams.get('download') === '1';

    if (format !== 'markdown' && format !== 'pdf') {
      return NextResponse.json({ success: false, error: 'Unsupported format' }, { status: 400 });
    }

    const ctx = await fetchAdminBookingExportContext(parsedId.data);
    if (!ctx) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    await supabaseAdmin.from('audit_log').insert({
      agent_id: 'APX-04',
      event: 'BOOKING_EXPORT',
      ref_id: parsedId.data,
      payload: {
        format,
        includeEmail,
        download,
        admin_user_id: sessionOrResponse.userId,
      },
    });

    const headers: Record<string, string> = {
      'Cache-Control': 'no-store',
    };

    if (format === 'pdf') {
      const pdfBytes = await renderBookingBriefPdf(ctx, { includeEmail });
      const filename = buildBookingExportPdfFilename(ctx);
      headers['Content-Type'] = 'application/pdf';
      if (download) {
        headers['Content-Disposition'] = `attachment; filename="${filename}"`;
      }
      return new NextResponse(Buffer.from(pdfBytes), { status: 200, headers });
    }

    const markdown = formatBookingExportMarkdown(ctx, { includeEmail });
    const filename = buildBookingExportFilename(ctx);
    headers['Content-Type'] = 'text/markdown; charset=utf-8';
    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(markdown, { status: 200, headers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}