import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyAdminsReferralPayout } from '@/lib/admin-notifications'

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  try {
    // Get pending earnings
    const pendingEarnings = await prisma.referralEarning.findMany({
      where: { referrerId: userId, status: 'Pending' }
    })

    const totalPending = pendingEarnings.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)

    if (totalPending <= 0) {
      return NextResponse.json({ error: 'No hay comisiones pendientes' }, { status: 400 })
    }

    const { getPlatformConfig } = await import('@/lib/prisma');
    const config = await getPlatformConfig()
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

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    await notifyAdminsReferralPayout({
      requesterName: requester?.name,
      requesterEmail: requester?.email,
      amount: totalPending,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Solicitud enviada. Te contactaremos pronto para procesar el pago.' 
    })
  } catch (error) {
    console.error('Payout request error:', error)
    return NextResponse.json({ error: 'Error al solicitar el pago de comisiones' }, { status: 500 })
  }
}
