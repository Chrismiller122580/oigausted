import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params   // ← This is the required fix

    const gig = await prisma.gig.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
            bio: true
          }
        }
      }
    })

    if (!gig) {
      return NextResponse.json({ error: "Gig not found" }, { status: 404 })
    }

    return NextResponse.json({ gig })
  } catch (error) {
    console.error("Error fetching gig:", error)
    return NextResponse.json({ error: "Failed to fetch gig" }, { status: 500 })
  }
}
