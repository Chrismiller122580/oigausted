import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-wompi-signature') || ''

    if (!body?.event || !body?.data?.transaction) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const event = body.event
    const transaction = body.data.transaction

    // Handle successful payment
    if (event === 'transaction.updated' && transaction?.status === 'APPROVED') {
      const reference = transaction.reference
      const orderId = reference.replace('order_', '')

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: "Paid"
            // paidAt removed for now to avoid schema error
          }
        })

        console.log(`✅ Payment APPROVED and order updated: ${orderId}`)
      }
    }

    // You can add more event types later (e.g. DECLINED, ERROR)

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('Wompi webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}