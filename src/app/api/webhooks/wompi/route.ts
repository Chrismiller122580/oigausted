import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'
import { devLog } from '@/lib/utils'
import { confirmWompiPayment } from '@/lib/server/confirm-wompi-payment'
import {
  verifyWompiSignature,
  verifyWompiSignatureDetailed,
  getEventsKeyInfo,
} from '@/lib/wompi-signature'
import crypto from 'crypto'

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

    const verifyWompiEvent = (event: any, eventsKey: string) => {
      const signature = event.signature;
      if (!signature?.properties || !eventsKey) {
        return { valid: false, payload: '', reason: "Missing signature or key" };
      }

      const propValues = signature.properties
        .map((prop: string) => {
          let val: any = null;

          // Priority 1: data.transaction.xxx
          if (prop.startsWith('transaction.')) {
            const subProp = prop.replace('transaction.', '');
            let temp = event?.data?.transaction;
            subProp.split('.').forEach(k => temp = temp?.[k]);
            if (temp !== undefined && temp !== null) val = temp;
          }

          // Priority 2: direct transaction.xxx
          if (val === null) {
            let temp = event?.transaction;
            prop.split('.').forEach(k => temp = temp?.[k]);
            if (temp !== undefined && temp !== null) val = temp;
          }

          // Priority 3: direct on root
          if (val === null) {
            let temp = event;
            prop.split('.').forEach(k => temp = temp?.[k]);
            if (temp !== undefined && temp !== null) val = temp;
          }

          return String(val ?? '');
        })
        .join('');

      const timestamp = String(event.timestamp || '');

      const fullPayload = `${propValues}${timestamp}${eventsKey}`;

      const computed = crypto
        .createHmac('sha256', eventsKey)
        .update(fullPayload)
        .digest('hex');

      const isValid = computed === signature.checksum;

      return { 
        valid: isValid, 
        computed, 
        payload: fullPayload,
        receivedChecksum: signature.checksum,
        reason: isValid ? 'OK' : 'HMAC mismatch'
      };
    };
    const headerTimestamp = 
      request.headers.get('x-wompi-timestamp') ||
      request.headers.get('X-Wompi-Timestamp') ||
      request.headers.get('x-event-timestamp')

    // Prefer timestamp from header if present (more reliable), fallback to body
    const receivedTimestamp = headerTimestamp 
      ? parseInt(headerTimestamp) 
      : (body?.timestamp ? parseInt(body.timestamp) : null)

    // Always log key state + basic event info on every webhook (helps diagnose when 401s happen)
    const keyInfo = getEventsKeyInfo()
    console.log('[Wompi][Webhook] Received event', {
      event: body?.event,
      wompiTransactionId: body?.data?.transaction?.id,
      reference: body?.data?.transaction?.reference,
      status: body?.data?.transaction?.status,
      environment: body?.environment,
      eventsKeyPresent: keyInfo.present,
      eventsKeyHint: keyInfo.envHint,
      eventsKeyPrefix: keyInfo.prefix,
    })

    // 1. Verify signature first (critical security check)
    // Using the improved verifier with timestamp (user-provided Fix 1)
    const eventsKey = process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_EVENTS_SECRET || '';
    const verification = verifyWompiEvent(body, eventsKey);
    if (!verification.valid) {
      // Always emit to Vercel logs (devLog suppressed in prod). Include the exact payload for diagnosis.
      console.warn('[Wompi][Webhook] INVALID SIGNATURE — webhook rejected with 401', {
        receivedChecksumPrefix: (receivedSignature || '').slice(0, 16) + '...',
        computed: verification.computed,
        payload: verification.payload,
        receivedChecksum: verification.receivedChecksum,
        event: body?.event,
        reference: body?.data?.transaction?.reference,
        wompiTransactionId: body?.data?.transaction?.id,
        environment: body?.environment,
        eventsKeyPrefix: eventsKey.slice(0, 12) + '...',
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

// Handle non-POST methods gracefully. Direct browser access (GET) or validation pings
// previously resulted in ugly 405 error pages. Webhook providers may probe the endpoint.
export async function GET() {
  return NextResponse.json({
    message: 'Wompi webhook endpoint is active. This URL only accepts POST requests containing signed transaction events from Wompi.',
    publicKey: 'pub_prod_SZdbUpSGERKCIGAcJOaIax7ySu4w9tAN',
    eventsKey: 'prod_events_jxa0Bz1S7uHmr1Nc3g4wL4u4i0DySop (must be the exact "secreto de eventos" / Llave para eventos from Wompi dashboard "Secretos para integración técnica" for this pub key - validate with real events in admin tester)',
    docs: 'See https://docs.wompi.co/docs/colombia/inicio-rapido/ and https://docs.wompi.co/docs/colombia/eventos/ (and widget-checkout-web for integrity). The signature is the HMAC of the property values concatenated in the order listed in signature.properties, using the event secret. Use the admin Wompi tester with a real "Evento" JSON as sampleEvent (+ optional testEventsKey) until it reports matches:true. The basic samples are dummies only. After finding the correct one, set in Vercel and redeploy.'
  });
}

export async function HEAD() {
  // Simple liveness for any health checks
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 204,
    headers: {
      Allow: 'POST, GET, HEAD, OPTIONS'
    }
  });
}