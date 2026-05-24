import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature') || '';
    
    // TODO: Verify signature and construct stripe event
    // TODO: Invoke PaymentAgent APX-05 to reconcile state
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
