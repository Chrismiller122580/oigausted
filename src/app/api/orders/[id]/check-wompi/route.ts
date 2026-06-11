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

  const privateKey = process.env.WOMPI_PRIVATE_KEY || '';
  const pubKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';

  // Prefer public key for read-only status queries (officially supported by Wompi for verifying transaction status).
  // Private key is optional / used for privileged actions (voids, payouts, etc.). This endpoint no longer requires it.
  const authToken = privateKey || pubKey;
  if (!authToken) {
    return NextResponse.json({
      error: 'Wompi is not configured (missing NEXT_PUBLIC_WOMPI_PUBLIC_KEY).',
      details: 'At least the public key is required to query transaction status.'
    }, { status: 500 });
  }

  const reference = `order_${orderId}`;

  // Choose the correct Wompi API base: sandbox vs production, matching the public key in use.
  // This ensures "Consultar Wompi API" finds sandbox transactions when using test keys.
  const isSandbox = /test|sandbox|_test_/i.test(pubKey);
  const wompiBase = isSandbox ? 'https://sandbox.wompi.co' : 'https://production.wompi.co';

  // Support direct lookup by Wompi transaction ID (preferred/official way: GET /v1/transactions/{id})
  // or fallback to list filtered by our merchant reference.
  // The client can pass { transactionId } in the POST body when known from widget result.
  let txIdFromBody: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    txIdFromBody = body?.transactionId ? String(body.transactionId) : null;
  } catch {}

  try {
    const wompiUrl = txIdFromBody
      ? `${wompiBase}/v1/transactions/${encodeURIComponent(txIdFromBody)}`
      : `${wompiBase}/v1/transactions?reference=${encodeURIComponent(reference)}`;

    const res = await fetch(wompiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`,
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
        wompiBase,
        queriedBy: txIdFromBody ? 'id' : 'reference',
        authType: privateKey ? 'private' : 'public',
      });
    }

    devLog('[Wompi][check-wompi] Transaction found', {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amount_in_cents: transaction.amount_in_cents,
      error: transaction.error || transaction.status_message,
      queriedBase: wompiBase,
      byId: !!txIdFromBody,
      authPrefix: authToken.slice(0, 8),
    });

    // Extract any Wompi error details (signature errors, etc. often appear here)
    const wompiError = transaction.error
      || transaction.status_message
      || (transaction.payment_method && transaction.payment_method.extra_params && transaction.payment_method.extra_params.error_message)
      || null;

    const isErrorStatus = ['ERROR', 'DECLINED', 'VOIDED'].includes(transaction.status);

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
        wompiError,
        wompiBase,
        queriedBy: txIdFromBody ? 'id' : 'reference',
        authType: privateKey ? 'private' : 'public',
      });
    }

    // For other statuses or if already updated, just report back — surface error prominently if present
    let message = `Wompi status: ${transaction.status}`;
    if (isErrorStatus && wompiError) {
      message = `Wompi ${transaction.status}: ${wompiError}`;
    } else if (wompiError) {
      message = `Wompi: ${wompiError} (status ${transaction.status})`;
    }

    return NextResponse.json({
      success: true,
      message,
      transaction,
      wompiTransactionId: transaction.id,
      wompiError: isErrorStatus || wompiError ? wompiError : undefined,
      wompiBase, // sandbox or production that was queried (useful for debugger)
      queriedBy: txIdFromBody ? 'id' : 'reference',
      authType: privateKey ? 'private' : 'public',
      // Include key fields for easy display in debugger
      wompiSummary: {
        id: transaction.id,
        status: transaction.status,
        reference: transaction.reference,
        amount_in_cents: transaction.amount_in_cents,
        currency: transaction.currency,
        created_at: transaction.created_at,
        finalized_at: transaction.finalized_at,
        payment_method_type: transaction.payment_method_type,
        error: wompiError,
      },
    });
  } catch (e: any) {
    devLog('[Wompi][check-wompi] Unexpected error', e);
    return NextResponse.json({ error: e.message || 'Unexpected error querying Wompi' }, { status: 500 });
  }
}
