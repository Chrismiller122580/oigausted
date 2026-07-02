import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSqliteDatabase, toPrismaJson } from '@/lib/utils'

type RouteCtx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await ctx.params
  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (typeof body.name === 'string') data.name = body.name.trim()
  if (typeof body.description === 'string') data.description = body.description.trim()
  if (typeof body.icon === 'string') data.icon = body.icon
  if (typeof body.categoryHint === 'string') data.categoryHint = body.categoryHint
  if (typeof body.aiPromptHint === 'string') data.aiPromptHint = body.aiPromptHint.trim()
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  if (typeof body.order === 'number') data.order = body.order
  if (typeof body.basePriceCOP === 'number' || body.basePriceCOP === null) {
    data.basePriceCOP = body.basePriceCOP
  }
  if (Array.isArray(body.fields)) {
    data.fields = isSqliteDatabase() ? JSON.stringify(body.fields) : toPrismaJson(body.fields)
  }

  const updated = await prisma.documentTemplate.update({
    where: { id },
    data,
  })

  return NextResponse.json({ template: updated })
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await ctx.params
  await prisma.documentTemplate.update({
    where: { id },
    data: { isActive: false },
  })
  return NextResponse.json({ ok: true })
}