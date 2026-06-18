import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isMissingShowcaseColumnError, PUBLIC_PROFILE_GIG_LIMIT } from '@/lib/gig-showcase'

const showcaseSelect = {
  id: true,
  title: true,
  price: true,
  category: true,
  imageUrl: true,
  isActive: true,
  showOnProfile: true,
  profileShowcaseOrder: true,
  createdAt: true,
} as const

const showcaseFallbackSelect = {
  id: true,
  title: true,
  price: true,
  category: true,
  imageUrl: true,
  isActive: true,
  createdAt: true,
} as const

type ShowcaseGigRow = Prisma.GigGetPayload<{ select: typeof showcaseSelect }>
type ShowcaseFallbackGigRow = Prisma.GigGetPayload<{ select: typeof showcaseFallbackSelect }>
type OwnedGigRow = Prisma.GigGetPayload<{ select: { id: true } }>

export async function GET() {
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

    let gigs: ShowcaseGigRow[]
    try {
      gigs = await prisma.gig.findMany({
        where: { sellerId, deletedAt: null },
        select: showcaseSelect,
        orderBy: [{ profileShowcaseOrder: 'asc' }, { createdAt: 'desc' }],
      })
    } catch (e) {
      if (!isMissingShowcaseColumnError(e)) throw e
      const fallbackGigs: ShowcaseFallbackGigRow[] = await prisma.gig.findMany({
        where: { sellerId, deletedAt: null },
        select: showcaseFallbackSelect,
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({
        gigs: fallbackGigs.map((g: ShowcaseFallbackGigRow) => ({
          ...g,
          showOnProfile: true,
          profileShowcaseOrder: null,
        })),
        maxShowcase: PUBLIC_PROFILE_GIG_LIMIT,
        showcaseSupported: false,
      })
    }

    return NextResponse.json({
      gigs,
      maxShowcase: PUBLIC_PROFILE_GIG_LIMIT,
      showcaseSupported: true,
    })
  } catch (error: unknown) {
    console.error('Showcase GET failed:', error)
    return NextResponse.json({ error: 'Error al cargar servicios destacados' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json()
    const gigIds = Array.isArray(body?.gigIds) ? (body.gigIds as unknown[]) : null
    if (!gigIds) {
      return NextResponse.json({ error: 'gigIds debe ser un arreglo' }, { status: 400 })
    }

    const uniqueIds = [...new Set(gigIds.filter((id): id is string => typeof id === 'string' && id.length > 0))]
    if (uniqueIds.length > PUBLIC_PROFILE_GIG_LIMIT) {
      return NextResponse.json(
        { error: `Puedes destacar máximo ${PUBLIC_PROFILE_GIG_LIMIT} servicios en tu perfil público` },
        { status: 400 }
      )
    }

    const ownedGigs = await prisma.gig.findMany({
      where: { sellerId, deletedAt: null },
      select: { id: true },
    })
    const ownedIds = new Set(ownedGigs.map((g: OwnedGigRow) => g.id))
    if (!uniqueIds.every((id) => ownedIds.has(id))) {
      return NextResponse.json({ error: 'Uno o más servicios no te pertenecen' }, { status: 400 })
    }

    const showcaseSet = new Set(uniqueIds)

    try {
      await prisma.$transaction([
        ...ownedGigs.map((g: OwnedGigRow) =>
          prisma.gig.update({
            where: { id: g.id },
            data: {
              showOnProfile: showcaseSet.has(g.id),
              profileShowcaseOrder: showcaseSet.has(g.id)
                ? uniqueIds.indexOf(g.id)
                : null,
            },
          })
        ),
      ])
    } catch (e) {
      if (isMissingShowcaseColumnError(e)) {
        return NextResponse.json(
          { error: 'La función de destacados aún no está disponible. Intenta de nuevo en unos minutos.' },
          { status: 503 }
        )
      }
      throw e
    }

    const gigs = await prisma.gig.findMany({
      where: { sellerId, deletedAt: null },
      select: showcaseSelect,
      orderBy: [{ profileShowcaseOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ success: true, gigs })
  } catch (error: unknown) {
    console.error('Showcase PATCH failed:', error)
    return NextResponse.json({ error: 'Error al guardar servicios destacados' }, { status: 500 })
  }
}