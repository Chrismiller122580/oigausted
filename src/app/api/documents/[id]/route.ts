import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSqliteDatabase, toPrismaJson } from '@/lib/utils'
import { parsePrintShopInput } from '@/lib/documents/print-shop'

type RouteCtx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const doc = await prisma.documentRequest.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (doc.userId !== session.user.id && !isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  return NextResponse.json(doc)
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const doc = await prisma.documentRequest.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (doc.userId !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.editedContent && typeof body.editedContent === 'object') {
    data.editedContent = isSqliteDatabase()
      ? JSON.stringify(body.editedContent)
      : toPrismaJson(body.editedContent)
  }
  const hasPrintShopFields =
    'printShopEmail' in body || 'printShopName' in body || 'printShopPhone' in body
  if (hasPrintShopFields) {
    const parsed = parsePrintShopInput(body)
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    data.printShopEmail = parsed.printShopEmail
    data.printShopName = parsed.printShopName
    data.printShopPhone = parsed.printShopPhone
  }
  if (body.generatedContent && typeof body.generatedContent === 'object') {
    data.generatedContent = isSqliteDatabase()
      ? JSON.stringify(body.generatedContent)
      : toPrismaJson(body.generatedContent)
  }

  const updated = await prisma.documentRequest.update({
    where: { id },
    data,
  })

  return NextResponse.json(updated)
}