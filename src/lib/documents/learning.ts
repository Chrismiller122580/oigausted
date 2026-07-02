import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { devLog } from '@/lib/utils'
import {
  getStaticTemplateById,
  STATIC_COLOMBIAN_DOCUMENTS,
  type ColombianDocumentTemplate,
} from '@/lib/colombian-documents'
import type { DynamicFieldDef } from '@/types/gig-fields'
import type { Prisma } from '@prisma/client'

const SUGGEST_THRESHOLD_DEFAULT = 3

export interface LearnedDocumentMatch {
  type: 'template' | 'learned'
  template: ColombianDocumentTemplate
  confidence: number
  message?: string
}

export interface ClassifiedCustomDocument {
  slug: string
  displayName: string
  categoryHint: string
  aiPromptHint: string
  suggestedFields: DynamicFieldDef[]
}

function tokenize(text: string): string[] {
  return slugify(text)
    .split('-')
    .filter((t) => t.length > 2)
}

function similarityScore(a: string, b: string): number {
  const tokensA = new Set(tokenize(a))
  const tokensB = new Set(tokenize(b))
  if (tokensA.size === 0 || tokensB.size === 0) return 0
  let overlap = 0
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++
  }
  return overlap / Math.max(tokensA.size, tokensB.size)
}

/** Find closest static template or learned doc for a free-text description. */
export async function findSimilarDocument(description: string): Promise<LearnedDocumentMatch | null> {
  const normalized = description.trim().toLowerCase()
  if (!normalized) return null

  let best: LearnedDocumentMatch | null = null

  for (const template of STATIC_COLOMBIAN_DOCUMENTS) {
    const score = Math.max(
      similarityScore(normalized, template.name),
      similarityScore(normalized, template.description),
      similarityScore(normalized, template.id),
    )
    if (score >= 0.45 && (!best || score > best.confidence)) {
      best = {
        type: 'template',
        template,
        confidence: score,
        message: `Tenemos una plantilla similar: "${template.name}"`,
      }
    }
  }

  try {
    const learned = await prisma.documentLearnedRequest.findMany({
      where: { status: { in: ['learning', 'suggested', 'promoted'] } },
      orderBy: { requestCount: 'desc' },
      take: 50,
    })

    for (const row of learned) {
      const score = Math.max(
        similarityScore(normalized, row.displayName),
        similarityScore(normalized, row.rawDescription),
        similarityScore(normalized, row.slug),
      )
      if (score >= 0.4 && (!best || score > best.confidence)) {
        best = {
          type: 'learned',
          template: learnedRowToTemplate(row),
          confidence: score,
          message:
            row.requestCount >= 2
              ? `Otros usuarios también pidieron "${row.displayName}" (${row.requestCount} veces)`
              : `Solicitud similar detectada: "${row.displayName}"`,
        }
      }
    }
  } catch (e) {
    devLog('[DocumentLearning] findSimilar failed', e)
  }

  return best
}

function learnedRowToTemplate(row: {
  id: string
  slug: string
  displayName: string
  rawDescription: string
  categoryHint: string | null
  sampleFields: Prisma.JsonValue
  aiPromptHint: string | null
  requestCount: number
}): ColombianDocumentTemplate {
  const fields = Array.isArray(row.sampleFields)
    ? (row.sampleFields as unknown as DynamicFieldDef[])
    : getStaticTemplateById('carta-notificacion')?.fields.slice(0, 5) ?? []

  return {
    id: `learned-${row.slug}`,
    name: row.displayName,
    description: row.rawDescription.slice(0, 120),
    icon: '🌱',
    categoryHint: row.categoryHint || 'custom',
    fields,
    aiPromptHint: row.aiPromptHint || row.rawDescription,
    fromLearning: true,
    learnedRequestId: row.id,
    requestCount: row.requestCount,
  }
}

/** Classify a custom document request via Grok (fallback to heuristics). */
export async function classifyCustomDocument(
  description: string,
): Promise<ClassifiedCustomDocument> {
  const fallbackSlug = slugify(description).slice(0, 80) || 'documento-personalizado'
  const fallback: ClassifiedCustomDocument = {
    slug: fallbackSlug,
    displayName: description.trim().slice(0, 80) || 'Documento personalizado',
    categoryHint: 'custom',
    aiPromptHint: description.trim(),
    suggestedFields: [
      { key: 'descripcion', label: 'Descripción del documento', type: 'text', required: true },
      { key: 'partes', label: 'Partes involucradas', type: 'text' },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    ],
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
  if (!apiKey) return fallback

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'user',
            content: `Eres un experto en documentos legales y administrativos en Colombia.
El usuario necesita un documento que NO está en nuestro catálogo.

Descripción del usuario: "${description}"

Devuelve SOLO JSON válido (sin markdown) con esta forma:
{
  "displayName": "Nombre corto del tipo de documento en español",
  "slug": "slug-kebab-case-sin-tildes",
  "categoryHint": "laboral|civil|comercial|familiar|custom",
  "aiPromptHint": "Instrucción para redactar este documento conforme normativa colombiana",
  "suggestedFields": [
    { "key": "campo", "label": "Etiqueta", "type": "text", "required": true }
  ]
}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallback

    const parsed = JSON.parse(jsonMatch[0]) as Partial<ClassifiedCustomDocument> & {
      suggestedFields?: DynamicFieldDef[]
    }

    return {
      slug: slugify(parsed.slug || parsed.displayName || fallbackSlug),
      displayName: parsed.displayName || fallback.displayName,
      categoryHint: parsed.categoryHint || 'custom',
      aiPromptHint: parsed.aiPromptHint || description,
      suggestedFields: Array.isArray(parsed.suggestedFields)
        ? parsed.suggestedFields
        : fallback.suggestedFields,
    }
  } catch (e) {
    devLog('[DocumentLearning] classify failed', e)
    return fallback
  }
}

function mergeSampleFields(
  existing: DynamicFieldDef[] | null | undefined,
  incoming: Record<string, unknown>,
  suggested: DynamicFieldDef[],
): DynamicFieldDef[] {
  const byKey = new Map<string, DynamicFieldDef>()

  for (const f of existing || []) {
    byKey.set(f.key, f)
  }
  for (const f of suggested) {
    if (!byKey.has(f.key)) byKey.set(f.key, f)
  }
  for (const key of Object.keys(incoming)) {
    if (!byKey.has(key)) {
      byKey.set(key, { key, label: key, type: 'text' })
    }
  }

  return Array.from(byKey.values())
}

/**
 * Record a custom document request so the system learns over time.
 * Upserts by slug; increments requestCount; promotes to "suggested" at threshold.
 */
export async function recordLearnedDocumentRequest(opts: {
  description: string
  customFields?: Record<string, unknown>
  classified?: ClassifiedCustomDocument
  learnThreshold?: number
}): Promise<{ learnedRequestId: string; status: string; requestCount: number }> {
  const classified = opts.classified ?? (await classifyCustomDocument(opts.description))
  const threshold = opts.learnThreshold ?? SUGGEST_THRESHOLD_DEFAULT

  const existing = await prisma.documentLearnedRequest.findUnique({
    where: { slug: classified.slug },
  })

  const mergedFields = mergeSampleFields(
    existing?.sampleFields as DynamicFieldDef[] | undefined,
    opts.customFields ?? {},
    classified.suggestedFields,
  )

  const nextCount = (existing?.requestCount ?? 0) + 1
  let status = existing?.status ?? 'learning'
  if (status === 'dismissed') status = 'learning'
  if (nextCount >= threshold && status === 'learning') {
    status = 'suggested'
  }

  const row = await prisma.documentLearnedRequest.upsert({
    where: { slug: classified.slug },
    create: {
      slug: classified.slug,
      displayName: classified.displayName,
      rawDescription: opts.description.trim(),
      categoryHint: classified.categoryHint,
      sampleFields: mergedFields,
      aiPromptHint: classified.aiPromptHint,
      requestCount: 1,
      status: 1 >= threshold ? 'suggested' : 'learning',
      lastRequestedAt: new Date(),
    },
    update: {
      displayName: classified.displayName,
      rawDescription: opts.description.trim(),
      categoryHint: classified.categoryHint,
      sampleFields: mergedFields,
      aiPromptHint: classified.aiPromptHint,
      requestCount: nextCount,
      status,
      lastRequestedAt: new Date(),
    },
  })

  return {
    learnedRequestId: row.id,
    status: row.status,
    requestCount: row.requestCount,
  }
}

/** Community-learned templates surfaced in the catalog. */
export async function getLearnedCatalogTemplates(
  learnThreshold?: number,
): Promise<ColombianDocumentTemplate[]> {
  const threshold = learnThreshold ?? SUGGEST_THRESHOLD_DEFAULT

  try {
    const rows = await prisma.documentLearnedRequest.findMany({
      where: {
        status: { in: ['suggested', 'promoted'] },
        requestCount: { gte: Math.min(2, threshold) },
      },
      orderBy: [{ requestCount: 'desc' }, { lastRequestedAt: 'desc' }],
      take: 20,
    })

    return rows.map(learnedRowToTemplate)
  } catch {
    return []
  }
}

export async function getFullDocumentCatalog(learnThreshold?: number) {
  const learned = await getLearnedCatalogTemplates(learnThreshold)
  const staticIds = new Set(STATIC_COLOMBIAN_DOCUMENTS.map((t) => t.id))
  const uniqueLearned = learned.filter((t) => !staticIds.has(t.id))
  return [...STATIC_COLOMBIAN_DOCUMENTS, ...uniqueLearned]
}

export async function resolveTemplate(
  templateId: string,
  learnThreshold?: number,
): Promise<ColombianDocumentTemplate | null> {
  if (templateId === 'custom') {
    const { getCustomTemplate } = await import('@/lib/colombian-documents')
    return getCustomTemplate()
  }

  const staticTpl = getStaticTemplateById(templateId)
  if (staticTpl) return staticTpl

  if (templateId.startsWith('learned-')) {
    const slug = templateId.replace(/^learned-/, '')
    try {
      const row = await prisma.documentLearnedRequest.findUnique({ where: { slug } })
      if (row && row.status !== 'dismissed') return learnedRowToTemplate(row)
    } catch {
      /* db unavailable */
    }
  }

  const catalog = await getFullDocumentCatalog(learnThreshold)
  return catalog.find((t) => t.id === templateId) ?? null
}