import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, price, category, completionTime, fields = {}, addons = [], imageUrl } = body

    const seller = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const gig = await prisma.gig.create({
      data: {
        title,
        description,
        price: Number(price),
        category,
        completionTime,
        fields,
        addons,
        imageUrl: imageUrl || null,
        sellerId: seller.id,
      },
      include: {
        seller: {
          select: { id: true, name: true, businessName: true, email: true }
        }
      }
    })

    return NextResponse.json({ success: true, gig })
  } catch (error: any) {
    console.error('Create gig error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create gig' }, { status: 500 })
  }
}
