import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY;

if (process.env.NODE_ENV === 'production' && WOMPI_PUBLIC_KEY?.includes('test')) {
  console.warn('⚠️  WARNING: Using Wompi SANDBOX keys in production! Real payments will not be processed.');
}

function generateIntegritySignature(
  amountInCents: number,
  currency: string,
  reference: string
): string | null {
  if (!WOMPI_INTEGRITY_KEY) {
    return null;
  }

  const stringToSign = `${amountInCents}${currency}${WOMPI_PUBLIC_KEY}${reference}`;

  return crypto
    .createHmac('sha256', WOMPI_INTEGRITY_KEY)
    .update(stringToSign)
    .digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        gig: true,
        buyer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.buyerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const amountInCents = Math.round(order.price * 100);
    const reference = `order_${order.id}`;
    const currency = 'COP';

    const integritySignature = generateIntegritySignature(amountInCents, currency, reference);

    const checkoutData: any = {
      publicKey: WOMPI_PUBLIC_KEY,
      currency,
      amountInCents,
      reference,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}`,
      customerData: {
        email: order.buyer?.email || session.user.email || '',
        fullName: order.buyer?.name || session.user.name || '',
      },
    };

    // Add integrity signature when the key is available (recommended for production)
    if (integritySignature) {
      checkoutData.signature = {
        integrity: integritySignature,
      };
    }

    return NextResponse.json({
      success: true,
      checkoutData,
      reference,
      hasIntegritySignature: !!integritySignature,
    });

  } catch (error: any) {
    console.error('Wompi checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare Wompi checkout', details: error.message },
      { status: 500 }
    );
  }
}
