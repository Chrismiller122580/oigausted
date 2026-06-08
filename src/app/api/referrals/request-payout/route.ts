import { NextResponse } from 'next/server'
// @ts-ignore
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'
import { devLog, toPrismaJson } from '@/lib/utils'
import { logAuditEvent } from '@/lib/audit'

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

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

    // Mark as requested + audit in tx
    await prisma.$transaction(async (tx) => {
      await tx.referralEarning.updateMany({
        where: { referrerId: userId, status: 'Pending' },
        data: { status: 'Requested' }
      })

      await logAuditEvent({
        performedById: userId,
        action: 'REFERRAL_PAYOUT_REQUESTED',
        targetType: 'User',
        targetId: userId,
        details: toPrismaJson({ amount: totalPending }),
      });
    })

    // Notify all admins (best effort outside tx)
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true }
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
        data: { 
          referrerId: userId, 
          amount: totalPending,
          actions: [
            { label: 'Ver solicitud', action: 'view' }
          ]
        }
      })
    }

    // Also send email to support + all admins (better visibility)
    try {
      const { resend } = await import('@/lib/notifications')
      if (resend) {
        const adminEmails = admins.map(a => a.email).filter(Boolean) as string[]
        const toList = Array.from(new Set([config?.supportEmail || 'soporte@oigagig.com', ...adminEmails]))
        if (toList.length) {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'OigaUsted <support@oigagig.com>',
            to: toList,
            subject: 'Nueva solicitud de pago por referidos',
            html: `
              <p><strong>${requester?.name || requester?.email}</strong> ha solicitado el pago de comisiones por referidos.</p>
              <p><strong>Monto:</strong> $${totalPending.toLocaleString('es-CO')}</p>
              <p>Revisa el panel de administración para procesar el pago.</p>
            `
          })
        }
      }
    } catch (e) {
      devLog('Failed to send payout request email:', e)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Solicitud enviada. Te contactaremos pronto para procesar el pago.' 
    })
  } catch (error) {
    devLog('Payout request error:', error)
    return NextResponse.json({ error: 'Error al solicitar el pago de comisiones' }, { status: 500 })
  }
}
