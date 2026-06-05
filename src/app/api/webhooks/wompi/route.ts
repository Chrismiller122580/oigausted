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
    devLog('[Wompi] Signature comparison failed (likely invalid hex)', e)
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
      devLog('[Wompi] Invalid webhook signature received')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Basic replay attack protection (accept events from the last 10 minutes)
    if (receivedTimestamp) {
      const now = Math.floor(Date.now() / 1000)
      const tenMinutes = 10 * 60
      if (Math.abs(now - receivedTimestamp) > tenMinutes) {
        devLog('[Wompi] Webhook timestamp too old or in the future — possible replay attack')
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
        devLog('[Wompi] Could not extract orderId from reference:', reference)
        return NextResponse.json({ received: true })
      }

      // Fetch current to support idempotency checks
      const existingOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } })

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

      // Wrap status update + referralEarning create in tx for atomicity (prevents orphan earnings on crash/partial)
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const u = await tx.order.update({
          where: { id: orderId },
          data: updateData,
          include: {
            buyer: { select: { id: true, name: true } },
            gig: { select: { title: true } },
            seller: { select: { id: true, referredById: true } }
          }
        })

        if (transaction.status === 'APPROVED' && u.seller?.referredById) {
          // Idempotency inside tx too (best effort)
          const currentStatus = existingOrder?.status || u.status
          if (currentStatus !== 'Paid' && currentStatus !== 'Completed') {
            const { getEffectiveReferralRate } = await import('@/lib/payout')
            const rate = await getEffectiveReferralRate(u.seller.referredById)
            const amount = Math.round((u.price || 0) * rate)
            if (amount > 0) {
              try {
                await tx.referralEarning.create({
                  data: {
                    amount,
                    rateUsed: rate,
                    referrerId: u.seller.referredById,
                    orderId: u.id,
                    status: 'Pending',
                  }
                })
              } catch (e: any) {
                if (e.code !== 'P2002') devLog('[Wompi tx] referral create err (non dup):', e)
              }
            }
          }
        }
        return u
      })

      // Audit log for critical payment system change (webhook driven) — after tx commit
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
        // Idempotency: if already terminal paid, skip re-processing referral etc.
        const currentStatus = existingOrder?.status || updatedOrder.status
        if (currentStatus === 'Paid' || currentStatus === 'Completed') {
          devLog(`[Wompi] Order ${orderId} already ${currentStatus}, skipping re-trigger`);
        } else {
          // Payment confirmation now triggers both in-app + email automatically
          await notifications.sendInApp(
            updatedOrder.buyer.id,
            'payment',
            '¡Pago confirmado!',
            `Tu pago por "${updatedOrder.gig.title}" fue exitoso.`,
            `/orders/${orderId}`,
            { gigTitle: updatedOrder.gig.title, amount: updatedOrder.price, orderId }
          )

          // Note: referral earning create moved inside the tx above (the helper's notify still happens via the send path or can be called)
          // If needed, the helper can still be called for its notify side-effect (it will no-op create on P2002)
          if (updatedOrder.seller?.referredById) {
            const { createReferralEarningIfApplicable } = await import('@/lib/server/referral-earnings')
            await createReferralEarningIfApplicable(updatedOrder);
          }
        }
      }
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    devLog('[Wompi] Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}