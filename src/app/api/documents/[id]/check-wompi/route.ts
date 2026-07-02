import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fulfillDocumentByWompiReference } from '@/lib/server/fulfill-document-request'
import { devLog } from '@/lib/utils'

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const doc = await prisma.documentRequest.findUnique({ where: { id } })
  if (!doc || doc.userId !== session.user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  if (doc.status === 'Completed') {
    return NextResponse.json({ status: 'Completed', pdfUrl: doc.pdfUrl })
  }

  const body = await req.json().catch(() => ({}))
  const reference = doc.wompiReference
  if (!reference) {
    return NextResponse.json({ error: 'Sin referencia de pago' }, { status: 400 })
  }

  if (WOMPI_PRIVATE_KEY) {
    try {
      const txId = typeof body.transactionId === 'string' ? body.transactionId : ''
      const url = txId
        ? `https://production.wompi.co/v1/transactions/${txId}`
        : `https://production.wompi.co/v1/transactions?reference=${encodeURIComponent(reference)}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${WOMPI_PRIVATE_KEY}` },
      })
      const data = await res.json()
      const tx = data.data || (Array.isArray(data.data) ? data.data[0] : null)

      if (tx?.status === 'APPROVED' && tx?.reference === reference) {
        await prisma.documentRequest.update({
          where: { id },
          data: { status: 'Paid' },
        })
        const result = await fulfillDocumentByWompiReference(reference)
        const refreshed = await prisma.documentRequest.findUnique({ where: { id } })
        return NextResponse.json({
          status: refreshed?.status,
          pdfUrl: refreshed?.pdfUrl,
          fulfilled: result.ok,
        })
      }
    } catch (e) {
      devLog('[check-wompi doc]', e)
    }
  }

  return NextResponse.json({ status: doc.status, pending: true })
}