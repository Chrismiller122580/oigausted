import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        gig: true,
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ orders })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      console.error("No session found in POST /api/orders")
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { gigId } = await request.json()

    if (!gigId) {
      return NextResponse.json({ error: 'gigId is required' }, { status: 400 })
    }

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { seller: true }
    })

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    const order = await prisma.order.create({
      data: {
        gigId: gig.id,
        buyerId: session.user.id,
        sellerId: gig.sellerId,
        price: gig.price,
        status: "Pending"
      },
      include: {
        gig: true,
        buyer: true,
        seller: true
      }
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
