import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, getPlatformConfig } from '@/lib/prisma'
import { generateColombianDocument } from '@/lib/documents/generate'
import { resolveTemplate } from '@/lib/documents/learning'
import { isSqliteDatabase, toPrismaJson } from '@/lib/utils'

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const config = await getPlatformConfig()
  const doc = await prisma.documentRequest.findUnique({
    where: { id },
    include: { learnedRequest: true },
  })

  if (!doc || doc.userId !== session.user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const template = await resolveTemplate(doc.templateId, config.documentLearnThreshold ?? 3)
  if (!template) {
    return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
  }

  const customFields =
    typeof doc.customFields === 'string'
      ? (JSON.parse(doc.customFields) as Record<string, unknown>)
      : (doc.customFields as Record<string, unknown>)

  const content = await generateColombianDocument({
    template,
    customFields,
    customDescription: doc.customDescription || undefined,
    learnedPromptHint: doc.learnedRequest?.aiPromptHint || undefined,
  })

  const updated = await prisma.documentRequest.update({
    where: { id },
    data: {
      generatedContent: isSqliteDatabase()
        ? JSON.stringify(content)
        : toPrismaJson(content),
    },
  })

  return NextResponse.json({ content, request: updated })
}