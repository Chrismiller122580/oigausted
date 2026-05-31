import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const result = earnings.map(e => {
      const user = users.find(u => u.id === e.referrerId)
      const customRate = user?.customReferralRate
      const effectiveRate = customRate != null ? customRate : globalRate

      return {
        referrer: {
          id: e.referrerId,
          name: user?.name || user?.email || 'Usuario',
          email: user?.email || '',
        },
        referredCount: referredCountMap.get(e.referrerId) || 0,
        totalGenerated: e._sum.amount || 0,
        earningsCount: e._count.id,
        effectiveReferralRate: effectiveRate,
        customReferralRate: customRate,
      }
    })

    // Sort by total generated descending
    result.sort((a, b) => b.totalGenerated - a.totalGenerated)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin referrals error:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
