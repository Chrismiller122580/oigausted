import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { logAuditEvent } from '@/lib/audit'
import { devLog } from '@/lib/utils'
import { confirmWompiPayment } from '@/lib/server/confirm-wompi-payment'

const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_EVENTS_SECRET;

console.log('[Wompi] Events key loaded?', !!WOMPI_EVENTS_KEY, 'prefix:', (WOMPI_EVENTS_KEY || '').slice(0, 12) + '...');
if (WOMPI_EVENTS_KEY) {
  const eProd = /prod/i.test(WOMPI_EVENTS_KEY);
  console.log('[Wompi] Events key environment hint:', eProd ? 'prod' : 'test/sandbox');
}

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
  let body: any;
  try {
    body = await request.json()
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
        wompiTransactionId: body?.data?.transaction?.id,
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
      devLog('[Wompi][Webhook] Invalid payload (missing event or data.transaction)', {
        hasEvent: !!body?.event,
        hasTransaction: !!body?.data?.transaction,
        wompiTransactionId: body?.data?.transaction?.id || null,
      })
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
      hasRedirectUrl: !!transaction.redirect_url,
    })

    // Handle different transaction statuses
    if (event === 'transaction.updated') {
      const reference = transaction.reference
      const orderId = reference?.replace('order_', '')

      if (!orderId) {
        devLog('[Wompi][Webhook] Could not extract orderId from reference (transaction may not have been created via this app checkout)', {
          wompiTransactionId: transaction.id,
          reference,
          status: transaction.status,
        })
        return NextResponse.json({ received: true })
      }

      // Fetch current for quick idempotency decision
      const existingOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } })

      if (transaction.status === 'APPROVED') {
        devLog(`✅ Payment APPROVED for order: ${orderId} (delegating to confirm helper)`)

        const confirmRes = await confirmWompiPayment(orderId, {
          wompiTransactionId: transaction.id,
          wompiStatus: transaction.status,
          amount: transaction.amount_in_cents ? transaction.amount_in_cents / 100 : undefined,
          reference: transaction.reference,
        })

        // Webhook still returns 200 even if confirm was no-op (idempotent)
        return NextResponse.json({ received: true, event, orderStatus: confirmRes.newStatus || 'Paid' })
      }

      // Non-success terminal statuses: mark Cancelled (light path, no referral side effects)
      if (['DECLINED', 'ERROR', 'VOIDED'].includes(transaction.status)) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'Cancelled', updatedAt: new Date() },
        }).catch(() => {})

        await logAuditEvent({
          performedById: null,
          action: `PAYMENT_${transaction.status}`,
          targetType: 'Order',
          targetId: orderId,
          details: {
            wompiTransactionId: transaction.id,
            status: transaction.status,
            amount: transaction.amount_in_cents / 100,
            reference: transaction.reference,
          },
        }).catch(() => {})

        devLog(`❌ Payment ${transaction.status} for order: ${orderId}`)
        return NextResponse.json({ received: true, event })
      }

      if (transaction.status === 'PENDING') {
        devLog(`⏳ Payment still PENDING for order: ${orderId}`)
        return NextResponse.json({ received: true, event })
      }

      // Unknown status: acknowledge
      return NextResponse.json({ received: true, event })
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    const txId = body?.data?.transaction?.id || body?.data?.transaction?.reference || 'unknown'
    devLog('[Wompi] Webhook processing error:', { wompiTransactionId: txId, error })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}