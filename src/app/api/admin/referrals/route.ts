import { NextResponse } from 'next/server'
// @ts-ignore
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuditEvent } from '@/lib/audit'

export async function GET() {
  const session = await getServerSession(authOptions)
  const isAdmin = (session?.user as any)?.role === 'admin'

  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    // Get all referral earnings grouped by referrer
    const earnings = await prisma.referralEarning.groupBy({
      by: ['referrerId'],
      _sum: { amount: true },
      _count: { id: true },
    })

    const referrerIds = earnings.map(e => e.referrerId)

    const users = await prisma.user.findMany({
      where: { id: { in: referrerIds } },
      select: { id: true, name: true, email: true, customReferralRate: true }
    })

    const config = await prisma.platformConfig.findFirst()
    const globalRate = config?.referralCommissionRate ?? 0.05

    // Count referred users per referrer
    const referredCounts = await prisma.user.groupBy({
      by: ['referredById'],
      _count: { id: true },
      where: { referredById: { in: referrerIds } }
    })

    const referredCountMap = new Map(referredCounts.map(r => [r.referredById, r._count.id]))

    // Fetch all earnings for status breakdown (for payout management)
    const allEarnings = await prisma.referralEarning.findMany({
      where: { referrerId: { in: referrerIds } },
      select: { referrerId: true, amount: true, status: true }
    })

    const pendingMap = new Map<string, number>()
    const paidMap = new Map<string, number>()
    const requestedMap = new Map<string, number>()

    allEarnings.forEach(e => {
      if (e.status === 'Pending') {
        pendingMap.set(e.referrerId, (pendingMap.get(e.referrerId) || 0) + e.amount)
      } else if (e.status === 'Paid') {
        paidMap.set(e.referrerId, (paidMap.get(e.referrerId) || 0) + e.amount)
      } else if (e.status === 'Requested') {
        requestedMap.set(e.referrerId, (requestedMap.get(e.referrerId) || 0) + e.amount)
      }
    })

    const result = earnings.map(e => {
      const user = users.find(u => u.id === e.referrerId)
      const customRate = user?.customReferralRate
      const effectiveRate = customRate != null ? customRate : globalRate
      const rid = e.referrerId

      return {
        referrer: {
          id: rid,
          name: user?.name || user?.email || 'Usuario',
          email: user?.email || '',
        },
        referredCount: referredCountMap.get(rid) || 0,
        totalGenerated: e._sum.amount || 0,
        earningsCount: e._count.id,
        effectiveReferralRate: effectiveRate,
        customReferralRate: customRate,
        // Payout relevant
        pendingPayout: (pendingMap.get(rid) || 0) + (requestedMap.get(rid) || 0),
        paidOut: paidMap.get(rid) || 0,
        requestedAmount: requestedMap.get(rid) || 0,
      }
    })

    // Sort by pending payout descending for easy payout management
    result.sort((a, b) => b.pendingPayout - a.pendingPayout)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin referrals error:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

// PATCH to mark earnings as Paid (admin action for payouts)
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  const isAdmin = (session?.user as any)?.role === 'admin'
  if (!isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { referrerId } = await request.json()
    if (!referrerId) {
      return NextResponse.json({ error: 'referrerId requerido' }, { status: 400 })
    }

    const updated = await prisma.referralEarning.updateMany({
      where: { referrerId, status: { in: ['Pending', 'Requested'] } },
      data: { status: 'Paid' }
    })

    await logAuditEvent({
      performedById: (session?.user as any)?.id,
      action: 'REFERRAL_PAYOUT_MARKED_PAID',
      targetType: 'User',
      targetId: referrerId,
      details: { count: updated.count },
    })

    return NextResponse.json({ success: true, updated: updated.count })
  } catch (error) {
    console.error('Mark payout paid error:', error)
    return NextResponse.json({ error: 'Error al marcar como pagado' }, { status: 500 })
  }
}
