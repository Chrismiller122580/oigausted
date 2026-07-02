import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma, getPlatformConfig } from '@/lib/prisma'
import { fulfillDocumentRequest } from '@/lib/server/fulfill-document-request'

type RouteCtx = { params: Promise<{ id: string }> }

/** Test-mode payment simulation when wompiRealPaymentsEnabled is false. */
export async function POST(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const config = await getPlatformConfig()
  if (config.wompiRealPaymentsEnabled && !isAdmin(session)) {
    return NextResponse.json({ error: 'Usa Wompi para pagar' }, { status: 403 })
  }

  const doc = await prisma.documentRequest.findUnique({ where: { id } })
  if (!doc || (doc.userId !== session.user.id && !isAdmin(session))) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await prisma.documentRequest.update({
    where: { id },
    data: { status: 'Paid', wompiReference: doc.wompiReference || `DOC-TEST-${id}` },
  })

  const result = await fulfillDocumentRequest(id)
  const refreshed = await prisma.documentRequest.findUnique({ where: { id } })

  return NextResponse.json({
    status: refreshed?.status,
    pdfUrl: refreshed?.pdfUrl,
    fulfilled: result.ok,
    error: result.error,
  })
}