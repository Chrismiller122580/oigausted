import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const rows = await prisma.documentLearnedRequest.findMany({
    orderBy: [{ requestCount: 'desc' }, { lastRequestedAt: 'desc' }],
    take: 100,
  })

  return NextResponse.json({ learned: rows })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const id = typeof body.id === 'string' ? body.id : ''
  const status = typeof body.status === 'string' ? body.status : ''

  if (!id || !['learning', 'suggested', 'promoted', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'id y status requeridos' }, { status: 400 })
  }

  let updated = await prisma.documentLearnedRequest.update({
    where: { id },
    data: { status },
  })

  if (status === 'promoted') {
    const { promoteLearnedToTemplate } = await import('@/lib/documents/templates-db')
    await promoteLearnedToTemplate(id)
    updated = await prisma.documentLearnedRequest.findUniqueOrThrow({ where: { id } })
  }

  return NextResponse.json({ learned: updated })
}