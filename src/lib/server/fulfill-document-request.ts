import { prisma } from '@/lib/prisma'
import { devLog } from '@/lib/utils'
import { uploadDocumentArtifact } from '@/lib/documents/pdf'
import { sendDocumentDeliveryEmails } from '@/lib/documents/email'
import type { GeneratedDocumentContent } from '@/lib/documents/generate'

function parseContent(raw: unknown): GeneratedDocumentContent | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.title !== 'string' || typeof o.body !== 'string') return null
  return {
    title: o.title,
    body: o.body,
    disclaimer:
      typeof o.disclaimer === 'string'
        ? o.disclaimer
        : 'Borrador informativo — no sustituye asesoría legal.',
  }
}

export async function fulfillDocumentRequest(
  documentRequestId: string,
): Promise<{ ok: boolean; pdfUrl?: string; error?: string }> {
  const doc = await prisma.documentRequest.findUnique({
    where: { id: documentRequestId },
    include: { learnedRequest: true },
  })

  if (!doc) return { ok: false, error: 'Document request not found' }
  if (doc.status === 'Completed' && doc.pdfUrl) {
    return { ok: true, pdfUrl: doc.pdfUrl }
  }
  if (doc.status !== 'Paid' && doc.status !== 'PendingPayment') {
    return { ok: false, error: `Invalid status: ${doc.status}` }
  }

  const content =
    parseContent(doc.editedContent) ||
    parseContent(doc.generatedContent)

  if (!content) {
    await prisma.documentRequest.update({
      where: { id: documentRequestId },
      data: { status: 'Failed' },
    })
    return { ok: false, error: 'No document content to fulfill' }
  }

  try {
    const { pdfUrl } = await uploadDocumentArtifact(content, documentRequestId)

    await sendDocumentDeliveryEmails({
      buyerEmail: doc.buyerEmail,
      printShopEmail: doc.printShopEmail,
      printShopName: doc.printShopName,
      printShopPhone: doc.printShopPhone,
      templateName: doc.templateName,
      pdfUrl,
      content,
    })

    await prisma.documentRequest.update({
      where: { id: documentRequestId },
      data: {
        status: 'Completed',
        pdfUrl,
        completedAt: new Date(),
      },
    })

    return { ok: true, pdfUrl }
  } catch (e) {
    devLog('[FulfillDocument] error', e)
    await prisma.documentRequest.update({
      where: { id: documentRequestId },
      data: { status: 'Failed' },
    })
    return { ok: false, error: e instanceof Error ? e.message : 'Fulfillment failed' }
  }
}

export async function fulfillDocumentByWompiReference(
  reference: string,
): Promise<{ ok: boolean; documentRequestId?: string }> {
  const doc = await prisma.documentRequest.findUnique({
    where: { wompiReference: reference },
  })
  if (!doc) return { ok: false }

  if (doc.status === 'Completed') return { ok: true, documentRequestId: doc.id }

  await prisma.documentRequest.update({
    where: { id: doc.id },
    data: { status: 'Paid' },
  })

  const result = await fulfillDocumentRequest(doc.id)
  return { ok: result.ok, documentRequestId: doc.id }
}