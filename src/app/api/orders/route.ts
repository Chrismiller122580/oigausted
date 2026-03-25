import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PLATFORM_FEE_PERCENT = 0.12

export async function POST(req: NextRequest) {
  try {
    const { gigId, buyerId } = await req.json()

    const gig = await prisma.gig.findUnique({ where: { id: gigId } })
    if (!gig) return NextResponse.json({ error: "Gig not found" }, { status: 404 })

    const amount = gig.price
    const platformFee = amount * PLATFORM_FEE_PERCENT
    const sellerPayout = amount - platformFee

    const order = await prisma.order.create({
      data: {
        gigId,
        buyerId,
        sellerId: gig.sellerId,
        amount,
        platformFee,
        sellerPayout,
        status: "completed",
      },
      include: {
        gig: true,
        buyer: true,
        seller: true,
      },
    })

    return NextResponse.json({
      success: true,
      order,
      companyEarnings: platformFee,
      message: `Order created. Company earned $${platformFee.toLocaleString("es-CO")}`
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
