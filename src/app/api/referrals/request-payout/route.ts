import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Get pending earnings
    const pendingEarnings = await prisma.referralEarning.findMany({
      where: { referrerId: userId, status: 'Pending' }
    })

    const totalPending = pendingEarnings.reduce((sum, e) => sum + e.amount, 0)

    if (totalPending <= 0) {
      return NextResponse.json({ error: 'No hay comisiones pendientes' }, { status: 400 })
    }

    const config = await prisma.platformConfig.findFirst()
    const minPayout = config?.minPayoutAmount || 50000

    if (totalPending < minPayout) {
      return NextResponse.json({ 
        error: `El mínimo para solicitar pago es $${minPayout.toLocaleString('es-CO')}` 
      }, { status: 400 })
    }

    // Mark these earnings as requested (simple status update for beta)
    await prisma.referralEarning.updateMany({
      where: { referrerId: userId, status: 'Pending' },
      data: { status: 'Requested' }
    })

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true }
    })

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    const message = `${requester?.name || requester?.email} solicitó pago de comisiones por referidos por $${totalPending.toLocaleString('es-CO')}.`

    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        category: 'payment',
        type: 'in_app',
        title: 'Solicitud de pago por referidos',
        message,
        link: '/admin/referrals',
        data: { referrerId: userId, amount: totalPending }
      })
    }

    // Also send email to support
    try {
      const { resend } = await import('@/lib/notifications')
      if (resend) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'OigaUsted <support@oigagig.com>',
          to: config?.supportEmail || 'soporte@oigagig.com',
          subject: 'Nueva solicitud de pago por referidos',
          html: `
            <p><strong>${requester?.name || requester?.email}</strong> ha solicitado el pago de comisiones por referidos.</p>
            <p><strong>Monto:</strong> $${totalPending.toLocaleString('es-CO')}</p>
            <p>Revisa el panel de administración para procesar el pago.</p>
          `
        })
      }
    } catch (e) {
      console.error('Failed to send payout request email:', e)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Solicitud enviada. Te contactaremos pronto para procesar el pago.' 
    })
  } catch (error) {
    console.error('Payout request error:', error)
    return NextResponse.json({ error: 'Error al solicitar el pago de comisiones' }, { status: 500 })
  }
}
