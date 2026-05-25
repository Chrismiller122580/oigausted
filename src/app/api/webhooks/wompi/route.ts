import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY

function verifyWompiSignature(body: any, receivedSignature: string): boolean {
  if (!WOMPI_EVENTS_KEY) {
    console.error('[Wompi] WOMPI_EVENTS_KEY is not set in environment')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', WOMPI_EVENTS_KEY)
    .update(JSON.stringify(body))
    .digest('hex')

  const normalizedReceived = receivedSignature.replace('sha256=', '').trim()

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(normalizedReceived, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const receivedSignature = request.headers.get('x-wompi-signature') || ''

    // 1. Verify signature first (critical security check)
    if (!verifyWompiSignature(body, receivedSignature)) {
      console.error('[Wompi] Invalid webhook signature received')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    if (!body?.event || !body?.data?.transaction) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const event = body.event
    const transaction = body.data.transaction

    console.log(`[Wompi] Valid webhook received: ${event} - Status: ${transaction.status}`)

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
          console.log(`✅ Payment APPROVED for order: ${orderId}`)
          break

        case 'DECLINED':
        case 'ERROR':
        case 'VOIDED':
          updateData.status = 'Cancelled'
          console.log(`❌ Payment ${transaction.status} for order: ${orderId}`)
          break

        case 'PENDING':
          // Keep current status or set to something like "Payment Pending"
          console.log(`⏳ Payment still PENDING for order: ${orderId}`)
          return NextResponse.json({ received: true, event })
      }

      await prisma.order.update({
        where: { id: orderId },
        data: updateData,
      })
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('[Wompi] Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}