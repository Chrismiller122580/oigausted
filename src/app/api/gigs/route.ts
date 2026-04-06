import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const gigs = await prisma.gig.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            businessName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ gigs })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch gigs' }, { status: 500 })
  }
}
