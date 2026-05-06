import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { gigId } = await request.json(); // ignore buyer for now

    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;

    if (!publicKey) {
      return NextResponse.json({ error: 'Missing public key' }, { status: 500 });
    }

    const checkoutUrl = `https://checkout.wompi.co/?` +
      `public_key=${publicKey}` +
      `&amount_in_cents=8500000` +     // Hardcoded 85.000 COP for testing
      `&currency=COP` +
      `&reference=test_${Date.now()}` + // Always unique
      `&redirect_url=${encodeURIComponent('https://oigausted.vercel.app')}`;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      message: "Minimal test - no Prisma, no signature"
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}