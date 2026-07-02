import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, getPlatformConfig } from '@/lib/prisma'
import { CUSTOM_TEMPLATE_ID } from '@/lib/colombian-documents'
import {
  classifyCustomDocument,
  recordLearnedDocumentRequest,
  resolveTemplate,
} from '@/lib/documents/learning'
import { computeDocumentPrice } from '@/lib/documents/price'
import { isSqliteDatabase, toPrismaJson } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const buyerEmail = session?.user?.email
  if (!userId || !buyerEmail) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const config = await getPlatformConfig()
  if (config.documentStudioEnabled === false) {
    return NextResponse.json({ error: 'Buro de Documentos no disponible' }, { status: 403 })
  }

  const body = await req.json()
  const templateId = typeof body.templateId === 'string' ? body.templateId : ''
  const customFields =
    body.customFields && typeof body.customFields === 'object'
      ? (body.customFields as Record<string, unknown>)
      : {}
  const customDescription =
    typeof body.customDescription === 'string' ? body.customDescription.trim() : ''

  const template = await resolveTemplate(templateId, config.documentLearnThreshold ?? 3)
  if (!template) {
    return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 })
  }

  const isCustom = templateId === CUSTOM_TEMPLATE_ID || template.fromLearning === true
  const description =
    customDescription ||
    (typeof customFields.descripcion === 'string' ? customFields.descripcion : '') ||
    template.name

  let learnedRequestId: string | undefined = template.learnedRequestId

  if (isCustom || templateId === CUSTOM_TEMPLATE_ID) {
    const classified = await classifyCustomDocument(description)
    const learned = await recordLearnedDocumentRequest({
      description,
      customFields,
      classified,
      learnThreshold: config.documentLearnThreshold ?? 3,
    })
    learnedRequestId = learned.learnedRequestId
  } else if (template.learnedRequestId) {
    learnedRequestId = template.learnedRequestId
    try {
      await prisma.documentLearnedRequest.update({
        where: { id: template.learnedRequestId },
        data: { requestCount: { increment: 1 }, lastRequestedAt: new Date() },
      })
    } catch {
      /* non-fatal */
    }
  }

  const basePrice =
    isCustom || templateId === CUSTOM_TEMPLATE_ID
      ? (config.documentCustomPriceCOP ?? 25000)
      : (config.documentBasePriceCOP ?? 15000)

  const priceCOP = computeDocumentPrice(basePrice, template, customFields)
  const defaultPrintShop = config.documentPrintShopEmail || undefined

  const fieldsJson = isSqliteDatabase()
    ? JSON.stringify(customFields)
    : toPrismaJson(customFields)

  const created = await prisma.documentRequest.create({
    data: {
      userId,
      templateId,
      templateName: template.name,
      isCustom: isCustom || templateId === CUSTOM_TEMPLATE_ID,
      customDescription: isCustom ? description : null,
      customFields: fieldsJson as never,
      priceCOP,
      buyerEmail,
      printShopEmail: defaultPrintShop,
      learnedRequestId: learnedRequestId || null,
      status: 'Draft',
    },
  })

  return NextResponse.json({
    id: created.id,
    priceCOP: created.priceCOP,
    learnedRequestId,
    templateName: created.templateName,
  })
}