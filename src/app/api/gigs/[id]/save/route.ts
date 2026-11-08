import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ saved: false })
  const { id } = await params
  const row = await prisma.savedGig.findUnique({
    where: { userId_gigId: { userId: session.user.id, gigId: id } },
    select: { id: true },
  })
  return NextResponse.json({ saved: Boolean(row) })
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.savedGig.upsert({
    where: { userId_gigId: { userId: session.user.id, gigId: id } },
    create: { userId: session.user.id, gigId: id },
    update: {},
  })
  return NextResponse.json({ saved: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.savedGig.deleteMany({ where: { userId: session.user.id, gigId: id } })
  return NextResponse.json({ saved: false })
}
