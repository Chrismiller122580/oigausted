import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listPublicGigs } from '@/lib/gig-queries'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { buyerCity: true, buyerInterests: true, city: true },
  })
  const city = user?.buyerCity || user?.city || ''
  let interests: string[] = []
  try { interests = user?.buyerInterests ? JSON.parse(user.buyerInterests) : [] } catch { interests = [] }

  const collected: { id: string; title: string; price: number; category: string | null; city: string | null; imageUrl: string | null; sellerName: string | null }[] = []
  const seen = new Set<string>()

  const push = (gigs: Awaited<ReturnType<typeof listPublicGigs>>['gigs']) => {
    for (const g of gigs) {
      if (seen.has(g.id)) continue
      seen.add(g.id)
      collected.push({
        id: g.id,
        title: g.title,
        price: g.price,
        category: g.category ?? null,
        city: g.city ?? null,
        imageUrl: g.imageUrl ?? null,
        sellerName: g.seller?.businessName || g.seller?.name || null,
      })
    }
  }

  for (const cat of interests.slice(0, 3)) {
    const { gigs } = await listPublicGigs({ limit: 6, category: cat, city: city || undefined })
    push(gigs)
    if (collected.length >= 8) break
  }
  if (collected.length < 6) {
    const { gigs } = await listPublicGigs({ limit: 8, city: city || undefined })
    push(gigs)
  }
  if (collected.length < 4) {
    const { gigs } = await listPublicGigs({ limit: 8 })
    push(gigs)
  }

  return NextResponse.json({ city, interests, gigs: collected.slice(0, 8) })
}
