import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { devLog } from '@/lib/utils'

const networkSellerSelect = {
  id: true,
  name: true,
  businessName: true,
  slug: true,
  profilePicture: true,
  rating: true,
  reviewCount: true,
  city: true,
  whatsapp: true,
  latitude: true,
  longitude: true,
  serviceRadiusKm: true,
} as const

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sellerId = session?.user?.id
    const role = session?.user?.role

    if (!sellerId) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
    }
    if (role !== 'seller' && role !== 'admin') {
      return NextResponse.json({ error: 'Solo vendedores pueden acceder' }, { status: 403 })
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit
    const category = url.searchParams.get('category')

    const where = {
      isActive: true,
      deletedAt: null as null,
      sellerId: { not: sellerId },
      ...(category && category !== 'Todas' ? { category } : {}),
    }

    let total = 0
    let gigs: Awaited<ReturnType<typeof prisma.gig.findMany>> = []

    try {
      total = await prisma.gig.count({ where })
      gigs = await prisma.gig.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
    } catch (dbErr: unknown) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
      console.warn('[Seller Network] deletedAt filter failed, retrying', errMsg)
      const fallbackWhere = {
        isActive: true,
        sellerId: { not: sellerId },
        ...(category && category !== 'Todas' ? { category } : {}),
      }
      total = await prisma.gig.count({ where: fallbackWhere })
      gigs = await prisma.gig.findMany({
        where: fallbackWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
    }

    const sellerIds = [
      ...new Set(
        gigs
          .map((g: { sellerId: string }) => g.sellerId)
          .filter((id: string | null | undefined): id is string => !!id)
      ),
    ]

    const sellers = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: networkSellerSelect,
    })

    const sellerMap = Object.fromEntries(sellers.map((s: { id: string }) => [s.id, s]))

    const gigsWithSeller = gigs.map((gig: (typeof gigs)[number]) => ({
      ...gig,
      seller: sellerMap[gig.sellerId] || null,
    }))

    devLog(`Seller network gigs: ${gigsWithSeller.length}/${total} for seller ${sellerId}`)

    return NextResponse.json({
      gigs: gigsWithSeller,
      count: gigsWithSeller.length,
      total,
      page,
      limit,
      hasMore: skip + gigs.length < total,
    })
  } catch (error: unknown) {
    console.error('Seller network gigs failed:', error)
    return NextResponse.json({ error: 'Error al cargar la red de vendedores' }, { status: 500 })
  }
}