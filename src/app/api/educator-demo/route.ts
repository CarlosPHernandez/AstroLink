import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend-client';
import { EducatorDemoRequestSchema } from '@/lib/educators/educator-demo-schema';
import { supabaseAdmin } from '@/lib/supabase';
import { toFieldErrors } from '@/lib/zod-field-errors';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function salesNotificationEmail(): string | undefined {
  return process.env.EDUCATOR_LEADS_EMAIL?.trim() || undefined;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = EducatorDemoRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Check the highlighted fields.',
        fieldErrors: toFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const { fullName, email, schoolName, role, studentPopulation, message, referrer } = parsed.data;
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null;

  const { error: insertError } = await supabaseAdmin.from('educator_demo_requests').insert({
    full_name: fullName,
    email,
    school_name: schoolName,
    role,
    student_population: studentPopulation || null,
    message: message || null,
    referrer: referrer || null,
    user_agent: userAgent,
  });

  if (insertError) {
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Try again.' },
      { status: 500 },
    );
  }

  const salesEmail = salesNotificationEmail();
  if (salesEmail) {
    const rows: Array<[string, string]> = [
      ['Name', fullName],
      ['Email', email],
      ['School / program', schoolName],
      ['Role', role],
      ['Student population', studentPopulation || '—'],
      ['Message', message || '—'],
    ];
    const html = `
      <h2>New educator demo request</h2>
      <table cellpadding="6">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`,
          )
          .join('')}
      </table>
    `;
    // Fire-and-forget — lead is already durably stored above.
    void sendEmail({ to: salesEmail, subject: `Educator demo request — ${schoolName}`, html });
  }

  return NextResponse.json({ success: true });
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
