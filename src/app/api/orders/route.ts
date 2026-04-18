import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY

if (!WOMPI_PRIVATE_KEY) {
  console.error("❌ WOMPI_PRIVATE_KEY is not set in .env.local")
}

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

    // Create order in database
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

    // Generate Wompi transaction data + integrity signature
    const amountInCents = Math.round(gig.price * 100)
    const reference = `order_${order.id}`
    const currency = "COP"

    // Integrity signature (Wompi requirement)
    const integrityString = `${reference}${amountInCents}${currency}${WOMPI_PRIVATE_KEY}`
    const integritySignature = crypto
      .createHash('sha256')
      .update(integrityString)
      .digest('hex')

    console.log(`✅ Order created: ${order.id} | Reference: ${reference}`)

    return NextResponse.json({
      order,
      wompi: {
        amount_in_cents: amountInCents,
        currency,
        reference,
        integrity_signature: integritySignature,
        public_key: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Order creation failed:", error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}