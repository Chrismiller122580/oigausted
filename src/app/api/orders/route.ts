import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { gigId, price } = body

    const gig = await prisma.gig.findUnique({
      where: { id: gigId }
    })

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const order = await prisma.order.create({
      data: {
        price: Number(price),
        status: 'Pending',
        buyerId: buyer.id,
        sellerId: gig.sellerId,
        gigId: gig.id,
      },
      include: {
        gig: true,
        buyer: true,
        seller: true
      }
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
