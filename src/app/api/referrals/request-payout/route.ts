import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = session.user.id

    // Find all pending referral earnings for this user
    const pendingEarnings = await prisma.referralEarning.findMany({
      where: {
        referrerId: userId,
        status: 'Pending'
      }
    })

    if (pendingEarnings.length === 0) {
      return NextResponse.json({ error: 'No hay ganancias pendientes para pagar' }, { status: 400 })
    }

    const totalAmount = pendingEarnings.reduce((sum, e) => sum + e.amount, 0)

    // Update all to 'Requested' (admin can later mark as Paid)
    await prisma.referralEarning.updateMany({
      where: {
        referrerId: userId,
        status: 'Pending'
      },
      data: {
        status: 'Requested',
        updatedAt: new Date()
      }
    })

    // TODO: In future, create a proper Payout record and notify admin

    return NextResponse.json({
      success: true,
      message: `Solicitud de pago enviada por $${totalAmount.toLocaleString('es-CO')}. El equipo revisará y procesará el pago.`,
      amount: totalAmount
    })
  } catch (error) {
    console.error('Payout request error:', error)
    return NextResponse.json({ error: 'Error procesando la solicitud' }, { status: 500 })
  }
}
