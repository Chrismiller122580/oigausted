import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = session.user.id

    // Get current user with referral info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        referredById: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Generate referral code if missing
    let referralCode = user.referralCode
    if (!referralCode) {
      referralCode = user.id.slice(0, 8).toUpperCase()
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode }
      })
    }

    // Get referred users
    const referredUsers = await prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get PlatformConfig for the current rate
    const config = await prisma.platformConfig.findFirst()
    const referralRate = config?.referralCommissionRate ?? 0.05

    // Basic earnings calculation (placeholder - can be improved later)
    // For now we just count referred sellers and estimate
    const activeSellers = referredUsers.filter(u => u.role === 'seller').length
    const totalReferred = referredUsers.length

    // Real earnings from ReferralEarning records
    const earnings = await prisma.referralEarning.findMany({
      where: { referrerId: userId }
    })

    const totalEarned = earnings
      .filter(e => e.status === 'Paid' || e.status === 'Pending')
      .reduce((sum, e) => sum + e.amount, 0)

    const pendingEarnings = earnings
      .filter(e => e.status === 'Pending')
      .reduce((sum, e) => sum + e.amount, 0)

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com'}/signup?ref=${referralCode}`

    return NextResponse.json({
      referralCode,
      referralLink,
      stats: {
        totalReferred,
        activeSellers,
        totalEarned,
        pendingEarnings,
        referralRate,
      },
      referredUsers: referredUsers.map(u => ({
        id: u.id,
        name: u.name || u.email,
        businessName: u.businessName,
        joined: u.createdAt,
        status: u.role === 'seller' ? 'Active Seller' : 'Buyer',
        earnings: 0, // Per-user breakdown can be added later
      }))
    })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
