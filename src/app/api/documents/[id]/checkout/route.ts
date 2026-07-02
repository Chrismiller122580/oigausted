import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma, getPlatformConfig } from '@/lib/prisma'
import { getAppBaseUrl } from '@/lib/app-url'
import type { WompiCheckoutConfig } from '@/types/wompi'

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
const WOMPI_INTEGRITY_KEY =
  process.env.WOMPI_INTEGRITY_KEY || process.env.WOMPI_INTEGRITY_SECRET

function generateIntegritySignature(amountInCents: number, reference: string): string | null {
  if (!WOMPI_INTEGRITY_KEY) return null
  const integrityString = `${reference}${amountInCents}COP${WOMPI_INTEGRITY_KEY}`
  return crypto.createHash('sha256').update(integrityString).digest('hex')
}

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const config = await getPlatformConfig()
  const realPaymentsEnabled = config.wompiRealPaymentsEnabled ?? false

  const doc = await prisma.documentRequest.findUnique({ where: { id } })
  if (!doc || doc.userId !== session.user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  if (!doc.generatedContent && !doc.editedContent) {
    return NextResponse.json({ error: 'Genera el documento antes de pagar' }, { status: 400 })
  }

  if (!realPaymentsEnabled) {
    return NextResponse.json({
      testMode: true,
      documentRequestId: id,
      message: 'Pagos en modo prueba. Usa simular pago.',
    })
  }

  if (!WOMPI_PUBLIC_KEY) {
    return NextResponse.json({ error: 'Wompi no configurado' }, { status: 500 })
  }

  const reference = `DOC-${id.slice(0, 8)}-${Date.now()}`
  const amountInCents = Math.round(doc.priceCOP * 100)
  const integritySignature = generateIntegritySignature(amountInCents, reference)
  const baseUrl = getAppBaseUrl(req)

  await prisma.documentRequest.update({
    where: { id },
    data: { wompiReference: reference, status: 'PendingPayment' },
  })

  const checkoutData: WompiCheckoutConfig = {
    publicKey: WOMPI_PUBLIC_KEY,
    currency: 'COP',
    amountInCents,
    reference,
    redirectUrl: `${baseUrl}/documentos/${id}/success`,
    customerData: {
      email: session.user.email || doc.buyerEmail,
      fullName: session.user.name || '',
    },
    ...(integritySignature ? { signature: { integrity: integritySignature } } : {}),
  }

  return NextResponse.json({
    reference,
    amountInCents,
    priceCOP: doc.priceCOP,
    publicKey: checkoutData.publicKey,
    integrity: integritySignature,
    currency: 'COP',
    redirectUrl: checkoutData.redirectUrl,
    customerData: checkoutData.customerData,
    checkoutData,
  })
}