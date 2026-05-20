import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY; // Optional but recommended for signatures

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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

    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const amountInCents = Math.round(order.price * 100);
    const reference = `order_${order.id}`;

    // For now, we return the data needed for the Wompi Widget.
    // The frontend will either use the widget or fall back to a hosted URL.
    const checkoutData = {
      publicKey: WOMPI_PUBLIC_KEY,
      currency: 'COP',
      amountInCents,
      reference,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}`,
      customerData: {
        email: order.buyer?.email || session.user.email || '',
        fullName: order.buyer?.name || session.user.name || '',
      },
    };

    // Optional: In the future we can generate a hosted checkout URL here
    // using Wompi's API if needed.

    return NextResponse.json({
      success: true,
      checkoutData,           // Used by the widget
      reference,
      // checkoutUrl can be added later if using hosted checkout
    });

  } catch (error: any) {
    console.error('Wompi checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare Wompi checkout', details: error.message },
      { status: 500 }
    );
  }
}
