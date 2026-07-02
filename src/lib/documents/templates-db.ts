import { prisma } from '@/lib/prisma'
import { isSqliteDatabase, toPrismaJson } from '@/lib/utils'
import {
  STATIC_COLOMBIAN_DOCUMENTS,
  getCustomTemplate,
  type ColombianDocumentTemplate,
} from '@/lib/colombian-documents'
import type { DynamicFieldDef } from '@/types/gig-fields'
import type { Prisma } from '@prisma/client'

type TemplateRow = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  categoryHint: string
  fields: Prisma.JsonValue
  aiPromptHint: string
  basePriceCOP: number | null
  source: string
  learnedRequestId: string | null
  isActive: boolean
  order: number
}

function rowToTemplate(row: TemplateRow, extras?: Partial<ColombianDocumentTemplate>): ColombianDocumentTemplate {
  const fields = Array.isArray(row.fields) ? (row.fields as unknown as DynamicFieldDef[]) : []
  return {
    id: row.slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    categoryHint: row.categoryHint,
    fields,
    aiPromptHint: row.aiPromptHint,
    fromLearning: row.source === 'learned',
    learnedRequestId: row.learnedRequestId || undefined,
    ...extras,
  }
}

export async function seedStaticDocumentTemplates(): Promise<number> {
  let count = 0
  for (const [index, tpl] of STATIC_COLOMBIAN_DOCUMENTS.entries()) {
    const fieldsJson = isSqliteDatabase() ? JSON.stringify(tpl.fields) : toPrismaJson(tpl.fields)
    await prisma.documentTemplate.upsert({
      where: { slug: tpl.id },
      create: {
        slug: tpl.id,
        name: tpl.name,
        description: tpl.description,
        icon: tpl.icon,
        categoryHint: tpl.categoryHint,
        fields: fieldsJson as never,
        aiPromptHint: tpl.aiPromptHint,
        source: 'static',
        isActive: true,
        order: index,
      },
      update: {
        name: tpl.name,
        description: tpl.description,
        icon: tpl.icon,
        categoryHint: tpl.categoryHint,
        fields: fieldsJson as never,
        aiPromptHint: tpl.aiPromptHint,
        order: index,
      },
    })
    count++
  }
  return count
}

export async function getActiveDocumentTemplates(): Promise<ColombianDocumentTemplate[]> {
  try {
    const rows = await prisma.documentTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })
    if (rows.length > 0) {
      return rows.map((r: TemplateRow) => rowToTemplate(r))
    }
  } catch {
    /* table may not exist yet */
  }
  return STATIC_COLOMBIAN_DOCUMENTS
}

export async function resolveDocumentTemplate(slug: string): Promise<ColombianDocumentTemplate | null> {
  if (slug === 'custom') return getCustomTemplate()

  if (slug.startsWith('learned-')) {
    const learnedSlug = slug.replace(/^learned-/, '')
    try {
      const row = await prisma.documentTemplate.findFirst({
        where: { OR: [{ slug: learnedSlug }, { slug }] },
      })
      if (row) return rowToTemplate(row as TemplateRow)
    } catch {
      /* fallback below */
    }
  }

  try {
    const row = await prisma.documentTemplate.findUnique({ where: { slug } })
    if (row) return rowToTemplate(row as TemplateRow)
  } catch {
    /* fallback */
  }

  const staticTpl = STATIC_COLOMBIAN_DOCUMENTS.find((t) => t.id === slug)
  return staticTpl || null
}

export async function promoteLearnedToTemplate(learnedId: string): Promise<ColombianDocumentTemplate | null> {
  const learned = await prisma.documentLearnedRequest.findUnique({ where: { id: learnedId } })
  if (!learned) return null

  const existing = await prisma.documentTemplate.findUnique({
    where: { learnedRequestId: learnedId },
  })
  if (existing) {
    await prisma.documentLearnedRequest.update({
      where: { id: learnedId },
      data: { status: 'promoted' },
    })
    return rowToTemplate(existing as TemplateRow, { requestCount: learned.requestCount })
  }

  const fields = Array.isArray(learned.sampleFields)
    ? (learned.sampleFields as DynamicFieldDef[])
    : getCustomTemplate().fields.slice(0, 5)

  const fieldsJson = isSqliteDatabase() ? JSON.stringify(fields) : toPrismaJson(fields)
  const maxOrder = await prisma.documentTemplate.aggregate({ _max: { order: true } })
  const order = (maxOrder._max.order ?? 0) + 1

  const row = await prisma.documentTemplate.create({
    data: {
      slug: learned.slug,
      name: learned.displayName,
      description: learned.rawDescription.slice(0, 200),
      icon: '🌱',
      categoryHint: learned.categoryHint || 'custom',
      fields: fieldsJson as never,
      aiPromptHint: learned.aiPromptHint || learned.rawDescription,
      source: 'learned',
      learnedRequestId: learned.id,
      isActive: true,
      order,
    },
  })

  await prisma.documentLearnedRequest.update({
    where: { id: learnedId },
    data: { status: 'promoted' },
  })

  return rowToTemplate(row as TemplateRow, { requestCount: learned.requestCount })
}