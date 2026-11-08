import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'
import { buyerWhatsNewEmail } from '@/lib/emails/templates'
import { devLog } from '@/lib/utils'

/** Email active buyers about the new interest flow. Protected by CRON_SECRET. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const buyers = await prisma.user.findMany({
    where: { role: 'buyer', isActive: true, email: { not: null } },
    select: { id: true, name: true, email: true },
  })

  let sent = 0
  for (const b of buyers) {
    if (!b.email) continue
    const email = buyerWhatsNewEmail({ userName: b.name })
    try {
      await sendNotification({
        userId: b.id,
        category: 'system',
        type: 'email',
        title: email.subject,
        message: 'Responde 3 preguntas y te mostramos servicios en tu ciudad.',
        link: '/buyer/intereses',
        data: { kind: 'buyer_whats_new' },
      })
      sent++
    } catch (e) {
      devLog('[buyer-whats-new]', b.email, e)
    }
  }

  return NextResponse.json({ buyers: buyers.length, sent })
}
