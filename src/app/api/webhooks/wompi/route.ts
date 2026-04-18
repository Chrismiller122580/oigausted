import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-wompi-signature') || ''

    // Basic validation
    if (!body || !body.event || !body.data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const event = body.event
    const transaction = body.data.transaction

    if (event === 'transaction.updated' && transaction?.status === 'APPROVED') {
      const reference = transaction.reference

      // Extract order ID from reference (format: order_123)
      const orderId = reference.replace('order_', '')

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: "Paid",
          paidAt: new Date()
        }
      })

      console.log(`✅ Payment approved for order ${orderId}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Wompi webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}