import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromDb } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await requireAdminFromDb()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const status = new URL(req.url).searchParams.get('status') || 'pending'
  const flags = await prisma.contentReviewFlag.findMany({
    where: status === 'all' ? undefined : { status },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ flags, count: flags.length })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdminFromDb()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = await req.json()
  const id = String(body.id || '')
  const status = String(body.status || '')
  if (!id || !['cleared', 'removed', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
  }
  const flag = await prisma.contentReviewFlag.findUnique({ where: { id } })
  if (!flag) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const updated = await prisma.contentReviewFlag.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  })

  if (flag.targetType === 'gig') {
    if (status === 'cleared') {
      await prisma.gig.update({
        where: { id: flag.targetId },
        data: { isActive: true },
      }).catch(() => null)
    }
    if (status === 'removed') {
      await prisma.gig.update({
        where: { id: flag.targetId },
        data: { isActive: false, deletedAt: new Date() },
      }).catch(() => null)
    }
  }

  return NextResponse.json({ ok: true, flag: updated })
}
