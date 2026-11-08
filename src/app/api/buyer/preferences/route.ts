import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const URGENCIES = ['this_week', 'this_month', 'browsing'] as const

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { buyerCity: true, buyerInterests: true, buyerUrgency: true, buyerPrefsAt: true, city: true },
  })
  let interests: string[] = []
  try { interests = user?.buyerInterests ? JSON.parse(user.buyerInterests) : [] } catch { interests = [] }

  return NextResponse.json({
    city: user?.buyerCity || user?.city || '',
    interests,
    urgency: user?.buyerUrgency || '',
    completed: Boolean(user?.buyerPrefsAt),
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const city = String(body.city || '').trim().slice(0, 80)
  const interests = Array.isArray(body.interests)
    ? body.interests.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 5)
    : []
  const urgency = URGENCIES.includes(body.urgency) ? body.urgency : 'browsing'

  if (!city || interests.length === 0) {
    return NextResponse.json({ error: 'Elige ciudad y al menos un interés.' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      buyerCity: city,
      buyerInterests: JSON.stringify(interests),
      buyerUrgency: urgency,
      buyerPrefsAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
