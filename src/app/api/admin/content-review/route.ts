import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromDb } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type FlagRow = {
  id: string
  targetType: string
  targetId: string
  reason: string
  matches: string[]
  snippet: string
  status: string
  createdAt: Date
  reviewedAt: Date | null
  reviewedById: string | null
}

export async function GET(req: NextRequest) {
  const session = await requireAdminFromDb()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const status = new URL(req.url).searchParams.get('status') || 'pending'
  const flags =
    status === 'all'
      ? await prisma.$queryRaw<FlagRow[]>`
          SELECT * FROM "ContentReviewFlag" ORDER BY "createdAt" DESC LIMIT 200
        `
      : await prisma.$queryRaw<FlagRow[]>`
          SELECT * FROM "ContentReviewFlag"
          WHERE status = ${status}
          ORDER BY "createdAt" DESC
          LIMIT 200
        `
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
  const rows = await prisma.$queryRaw<FlagRow[]>`
    SELECT * FROM "ContentReviewFlag" WHERE id = ${id} LIMIT 1
  `
  const flag = rows[0]
  if (!flag) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.$executeRaw`
    UPDATE "ContentReviewFlag"
    SET status = ${status}, "reviewedAt" = NOW(), "reviewedById" = ${session.user.id}
    WHERE id = ${id}
  `

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

  return NextResponse.json({ ok: true })
}
