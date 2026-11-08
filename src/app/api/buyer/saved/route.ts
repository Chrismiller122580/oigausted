import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rows = await prisma.savedGig.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      gig: { select: { id: true, title: true, price: true, category: true, city: true, imageUrl: true, isActive: true } },
    },
  })
  return NextResponse.json({
    gigs: rows.filter(r => r.gig.isActive).map(r => r.gig),
  })
}
