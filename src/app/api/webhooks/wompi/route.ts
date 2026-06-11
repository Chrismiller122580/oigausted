import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { notifications } from '@/lib/notifications'
import { logAuditEvent } from '@/lib/audit'
import { devLog } from '@/lib/utils'

const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_EVENTS_SECRET;

if (process.env.NODE_ENV === 'production' && WOMPI_EVENTS_KEY?.includes('test')) {
  console.warn('⚠️  WARNING: Using Wompi SANDBOX keys in production! Webhook processing is in test mode.');
}

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined
  return path.split('.').reduce((current, key) => {
    if (current == null) return undefined
    return current[key]
  }, obj)
}

function resolveWompiProperty(body: any, prop: string): string {
  if (!prop) return ''
  // Wompi properties are paths such as "transaction.id", "transaction.amount_in_cents", "timestamp", etc.
  // They are resolved against the event root (body), which has data.transaction and top-level timestamp/signature.
  let val = getNestedValue(body, prop)
  if (val === undefined) {
    // Try under data (common)
    val = getNestedValue(body?.data, prop)
  }
  if (val === undefined && prop.startsWith('transaction.')) {
    // Try relative under data.transaction
    val = getNestedValue(body?.data?.transaction, prop.replace(/^transaction\./, ''))
  }
  if (val === undefined && prop === 'timestamp') {
    val = body?.timestamp
  }
  return val == null ? '' : String(val)
}

function verifyWompiSignature(body: any, receivedSignature: string): boolean {
  if (!WOMPI_EVENTS_KEY) {
    console.error('[Wompi] WOMPI_EVENTS_KEY is not set in environment')
    return false
  }

  // Per official Wompi Colombia Events docs:
  // - Use signature.properties (array of paths) from the event body.
  // - Concatenate the corresponding values (in listed order, no separators).
  // - HMAC-SHA256 using the Events Secret (WOMPI_EVENTS_KEY).
  // - Compare to X-Event-Checksum header or body.signature.checksum.
  // Properties can vary per event; always read from the payload.
  const sig = body?.signature || {}
  const properties: string[] = Array.isArray(sig.properties) ? sig.properties : []

  let signedPayload: string
  if (properties.length > 0) {
    signedPayload = properties.map((p: string) => resolveWompiProperty(body, p)).join('')
  } else {
    // Legacy fallback (older guidance / some events): timestamp + full body JSON
    const timestamp = (body?.timestamp || '').toString()
    signedPayload = `${timestamp}${JSON.stringify(body)}`
  }

  const expectedSignature = crypto
    .createHmac('sha256', WOMPI_EVENTS_KEY)
    .update(signedPayload)
    .digest('hex')

  const normalizedReceived = (receivedSignature || '').replace(/^sha256=/i, '').trim().toLowerCase()

  if (!normalizedReceived || !expectedSignature) return false

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
    // Wompi uses X-Event-Checksum for the events/webhook signature (see official docs).
    // Support common variants + legacy.
    const receivedSignature = 
      request.headers.get('x-event-checksum') ||
      request.headers.get('X-Event-Checksum') ||
      request.headers.get('x-wompi-signature') ||
      (body?.signature?.checksum || '') 
    const headerTimestamp = 
      request.headers.get('x-wompi-timestamp') ||
      request.headers.get('X-Wompi-Timestamp') ||
      request.headers.get('x-event-timestamp')

    // Prefer timestamp from header if present (more reliable), fallback to body
    const receivedTimestamp = headerTimestamp 
      ? parseInt(headerTimestamp) 
      : (body?.timestamp ? parseInt(body.timestamp) : null)

    // 1. Verify signature first (critical security check)
    if (!verifyWompiSignature(body, receivedSignature)) {
      devLog('[Wompi][Webhook] Invalid signature received', {
        receivedHeader: receivedSignature ? receivedSignature.slice(0, 20) + '...' : 'none',
        hasBodyTimestamp: !!body?.timestamp,
        event: body?.event,
        reference: body?.data?.transaction?.reference,
      })
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

    devLog(`[Wompi][Webhook] Valid event received`, {
      event,
      status: transaction.status,
      reference: transaction.reference,
      wompiTransactionId: transaction.id,
      amount_in_cents: transaction.amount_in_cents,
      currency: transaction.currency,
      customer_email: transaction.customer_email,
      created_at: transaction.created_at,
      finalized_at: transaction.finalized_at,
      fullTransactionKeys: Object.keys(transaction || {}),
    })

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
      // Use explicit select (not include) to avoid prod DB drift on columns like sellerPayoutAt
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const u = await tx.order.update({
          where: { id: orderId },
          data: updateData,
          select: {
            id: true,
            price: true,
            status: true,
            buyerId: true,
            sellerId: true,
            gigId: true,
            buyer: { select: { id: true, name: true } },
            gig: { select: { title: true } },
            seller: { select: { id: true, referredById: true } }
          }
        })

        if (transaction.status === 'APPROVED' && (u as any).seller?.referredById) {
          // Idempotency inside tx too (best effort)
          const currentStatus = existingOrder?.status || (u as any).status
          if (currentStatus !== 'Paid' && currentStatus !== 'Completed') {
            const { getEffectiveReferralRate } = await import('@/lib/payout')
            const rate = await getEffectiveReferralRate((u as any).seller.referredById)
            const amount = Math.round(((u as any).price || 0) * rate)
            if (amount > 0) {
              try {
                await tx.referralEarning.create({
                  data: {
                    amount,
                    rateUsed: rate,
                    referrerId: (u as any).seller.referredById,
                    orderId: (u as any).id,
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
          devLog(`[Wompi] ✅ APPROVED - Processing order ${orderId} (webhook confirmed real payment)`);
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