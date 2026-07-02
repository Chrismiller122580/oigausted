import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSqliteDatabase, slugify, toPrismaJson } from '@/lib/utils'
import { seedStaticDocumentTemplates } from '@/lib/documents/templates-db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const templates = await prisma.documentTemplate.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()

  if (body.seedStatic === true) {
    const count = await seedStaticDocumentTemplates()
    return NextResponse.json({ seeded: count })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const aiPromptHint = typeof body.aiPromptHint === 'string' ? body.aiPromptHint.trim() : ''
  const slug =
    typeof body.slug === 'string' && body.slug.trim()
      ? slugify(body.slug.trim())
      : slugify(name)

  if (!name || name.length < 3 || !aiPromptHint) {
    return NextResponse.json({ error: 'Nombre y aiPromptHint requeridos' }, { status: 400 })
  }

  const fields = Array.isArray(body.fields) ? body.fields : []
  const fieldsJson = isSqliteDatabase() ? JSON.stringify(fields) : toPrismaJson(fields)

  const maxOrder = await prisma.documentTemplate.aggregate({ _max: { order: true } })

  const created = await prisma.documentTemplate.create({
    data: {
      slug,
      name,
      description: description || name,
      icon: typeof body.icon === 'string' ? body.icon : '📄',
      categoryHint: typeof body.categoryHint === 'string' ? body.categoryHint : 'custom',
      fields: fieldsJson as never,
      aiPromptHint,
      basePriceCOP: typeof body.basePriceCOP === 'number' ? body.basePriceCOP : null,
      source: 'admin',
      isActive: body.isActive !== false,
      order: typeof body.order === 'number' ? body.order : (maxOrder._max.order ?? 0) + 1,
    },
  })

  return NextResponse.json({ template: created })
}