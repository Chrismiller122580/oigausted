import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { devLog } from '@/lib/utils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const isAdmin = (session?.user as any)?.role === 'admin';

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the caller owns the order (buyer or seller) or is admin
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true },
  });

  if (!order || (order.buyerId !== userId && order.sellerId !== userId && !isAdmin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ error: 'Wompi private key not configured on server' }, { status: 500 });
  }

  const reference = `order_${orderId}`;

  try {
    // Query Wompi Transactions API by reference.
    // Works with both sandbox (test keys) and production (live keys).
    const wompiUrl = `https://production.wompi.co/v1/transactions?reference=${encodeURIComponent(reference)}`;
    const res = await fetch(wompiUrl, {
      headers: {
        Authorization: `Bearer ${privateKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      devLog('[Wompi][check-wompi] Query failed', { status: res.status, body: errText });
      return NextResponse.json({ error: 'Failed to query Wompi', details: errText }, { status: 502 });
    }

    const data = await res.json();
    const transaction = data?.data?.[0];

    if (!transaction) {
      return NextResponse.json({
        success: true,
        message: 'No transaction found in Wompi for this reference yet.',
        transaction: null,
      });
    }

    devLog('[Wompi][check-wompi] Transaction found', {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amount_in_cents: transaction.amount_in_cents,
    });

    // If Wompi says APPROVED but our DB is still Pending, update it (bypass webhook issues)
    if (transaction.status === 'APPROVED' && order.status === 'Pending') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'Paid' },
      });
      devLog('[Wompi][check-wompi] Force-updated order to Paid', { orderId });

      return NextResponse.json({
        success: true,
        message: 'Order status updated to Paid based on Wompi transaction.',
        transaction,
      });
    }

    // For other statuses or if already updated, just report back
    return NextResponse.json({
      success: true,
      message: `Wompi status: ${transaction.status}`,
      transaction,
    });
  } catch (e: any) {
    devLog('[Wompi][check-wompi] Unexpected error', e);
    return NextResponse.json({ error: e.message || 'Unexpected error querying Wompi' }, { status: 500 });
  }
}
