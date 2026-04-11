import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const orderId = resolvedParams.id

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        gig: true,
        buyer: {
          select: { id: true, name: true, email: true }
        },
        seller: {
          select: { id: true, name: true, businessName: true, email: true }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Fetch order error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}
