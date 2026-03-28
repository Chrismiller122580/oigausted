import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET all gigs
export async function GET() {
  try {
    const gigs = await prisma.gig.findMany({
      include: {
        seller: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ gigs })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ gigs: [] })
  }
}

// POST - create new gig
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, category, price, deliveryDays } = body

    if (!title || !description || !category || !price) {
      return NextResponse.json({ 
        success: false, 
        error: "Faltan campos requeridos" 
      }, { status: 400 })
    }

    // Ensure demo seller exists
    let seller = await prisma.user.findUnique({
      where: { id: "demo-seller-id" }
    })

    if (!seller) {
      seller = await prisma.user.create({
        data: {
          id: "demo-seller-id",
          name: "Demo Vendedor",
          email: "demo@vendedor.com",
          role: "seller"
        }
      })
    }

    const gig = await prisma.gig.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        price: parseFloat(price),
        sellerId: "demo-seller-id",
      },
    })

    return NextResponse.json({ 
      success: true, 
      gig 
    })
  } catch (error) {
    console.error("Error creating gig:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
