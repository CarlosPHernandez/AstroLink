import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({
    session: {
      userId: session.userId,
      email: session.email,
      role: session.role,
      fullName: session.fullName,
    },
  });
}
