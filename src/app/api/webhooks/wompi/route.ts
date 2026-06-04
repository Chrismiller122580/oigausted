import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { notifications } from '@/lib/notifications'
import { logAuditEvent } from '@/lib/audit'
import { devLog } from '@/lib/utils'

const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY

if (process.env.NODE_ENV === 'production' && WOMPI_EVENTS_KEY?.includes('test')) {
  console.warn('⚠️  WARNING: Using Wompi SANDBOX keys in production! Webhook processing is in test mode.');
}

function verifyWompiSignature(body: any, receivedSignature: string): boolean {
  if (!WOMPI_EVENTS_KEY) {
    console.error('[Wompi] WOMPI_EVENTS_KEY is not set in environment')
    return false
  }

  // Wompi recommends signing: timestamp + JSON.stringify(event)
  // This prevents replay attacks when combined with timestamp validation.
  const timestamp = (body?.timestamp || '').toString()
  const signedPayload = `${timestamp}${JSON.stringify(body)}`

  const expectedSignature = crypto
    .createHmac('sha256', WOMPI_EVENTS_KEY)
    .update(signedPayload)
    .digest('hex')

  const normalizedReceived = receivedSignature.replace('sha256=', '').trim()

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(normalizedReceived, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (e) {
    console.error('[Wompi] Signature comparison failed (likely invalid hex)', e)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const receivedSignature = request.headers.get('x-wompi-signature') || ''
    const headerTimestamp = request.headers.get('x-wompi-timestamp')

    // Prefer timestamp from header if present (more reliable), fallback to body
    const receivedTimestamp = headerTimestamp 
      ? parseInt(headerTimestamp) 
      : (body?.timestamp ? parseInt(body.timestamp) : null)

    // 1. Verify signature first (critical security check)
    if (!verifyWompiSignature(body, receivedSignature)) {
      console.error('[Wompi] Invalid webhook signature received')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Basic replay attack protection (accept events from the last 10 minutes)
    if (receivedTimestamp) {
      const now = Math.floor(Date.now() / 1000)
      const tenMinutes = 10 * 60
      if (Math.abs(now - receivedTimestamp) > tenMinutes) {
        console.warn('[Wompi] Webhook timestamp too old or in the future — possible replay attack')
        return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 })
      }
    }

    if (!body?.event || !body?.data?.transaction) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const event = body.event
    const transaction = body.data.transaction

    devLog(`[Wompi] Valid webhook received: ${event} - Status: ${transaction.status}`)

    // Handle different transaction statuses
    if (event === 'transaction.updated') {
      const reference = transaction.reference
      const orderId = reference?.replace('order_', '')

      if (!orderId) {
        console.warn('[Wompi] Could not extract orderId from reference:', reference)
        return NextResponse.json({ received: true })
      }

      const updateData: any = {
        updatedAt: new Date(),
      }

      switch (transaction.status) {
        case 'APPROVED':
          updateData.status = 'Paid'
          devLog(`✅ Payment APPROVED for order: ${orderId}`)
          break

        case 'DECLINED':
        case 'ERROR':
        case 'VOIDED':
          updateData.status = 'Cancelled'
          devLog(`❌ Payment ${transaction.status} for order: ${orderId}`)
          break

        case 'PENDING':
          // Keep current status or set to something like "Payment Pending"
          devLog(`⏳ Payment still PENDING for order: ${orderId}`)
          return NextResponse.json({ received: true, event })
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          buyer: { select: { id: true, name: true } },
          gig: { select: { title: true } },
          seller: { select: { id: true, referredById: true } }
        }
      })

      // Audit log for critical payment system change (webhook driven)
      await logAuditEvent({
        performedById: null, // system / webhook
        action: `PAYMENT_${transaction.status}`,
        targetType: 'Order',
        targetId: orderId,
        details: {
          wompiTransactionId: transaction.id,
          status: transaction.status,
          amount: transaction.amount_in_cents / 100,
          reference: transaction.reference,
        },
      });

      if (transaction.status === 'APPROVED' && updatedOrder.buyer) {
        // Payment confirmation now triggers both in-app + email automatically
        await notifications.sendInApp(
          updatedOrder.buyer.id,
          'payment',
          '¡Pago confirmado!',
          `Tu pago por "${updatedOrder.gig.title}" fue exitoso.`,
          `/orders/${orderId}`,
          { gigTitle: updatedOrder.gig.title, amount: updatedOrder.price, orderId }
        )

        // Create referral earning if seller was referred (for Paid status).
        // Uses centralized helper (idempotent, handles notify).
        if (updatedOrder.seller?.referredById) {
          const { createReferralEarningIfApplicable } = await import('@/lib/server/referral-earnings')
          await createReferralEarningIfApplicable(updatedOrder);
        }
      }
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('[Wompi] Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}