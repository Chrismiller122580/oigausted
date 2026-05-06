import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { gigId, buyerId } = await request.json();

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { seller: true }
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig no encontrado' }, { status: 404 });
    }

    const order = await prisma.order.create({
      data: {
        gigId: gig.id,
        buyerId,
        sellerId: gig.sellerId,
        price: gig.price,
        status: 'Pending',
      }
    });

    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET!;
    const amountInCents = Math.round(gig.price * 100);
    const currency = 'COP';
    const reference = order.id.toString();

    // Generate signature (this is the key fix)
    let signature = '';
    if (integritySecret) {
      const stringToSign = `${reference}${amountInCents}${currency}${integritySecret}`;
      signature = crypto
        .createHash('sha256')
        .update(stringToSign)
        .digest('hex');
    } else {
      console.error("❌ WOMPI_INTEGRITY_SECRET is missing on server");
    }

    const checkoutUrl = `https://checkout.wompi.co/?` +
      `public_key=${publicKey}` +
      `&amount_in_cents=${amountInCents}` +
      `&currency=${currency}` +
      `&reference=${reference}` +
      `&signature:integrity=${signature}` +
      `&redirect_url=${encodeURIComponent(
        `${process.env.NEXTAUTH_URL || 'https://oigausted.vercel.app'}/orders/${order.id}`
      )}`;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      checkoutUrl
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}