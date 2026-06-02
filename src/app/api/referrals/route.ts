import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

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

    // Fetch earnings per referred seller
    const earningsBySeller: Record<string, number> = {}
    const referralEarnings = await prisma.referralEarning.findMany({
      where: { referrerId: userId },
      include: { order: { select: { sellerId: true } } }
    })

    referralEarnings.forEach(earning => {
      const sellerId = earning.order?.sellerId
      if (sellerId) {
        earningsBySeller[sellerId] = (earningsBySeller[sellerId] || 0) + earning.amount
      }
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
        earnings: earningsBySeller[u.id] || 0,
      }))
    })
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return NextResponse.json({ error: 'Error cargando datos de referidos' }, { status: 500 })
  }
}

// Allow users (especially Google signups) to manually claim a referral code
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { referralCode } = await req.json()
    if (!referralCode) {
      return NextResponse.json({ error: 'Código de referido requerido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    if (user.referredById) {
      return NextResponse.json({ error: 'Ya estás vinculado a un referidor' }, { status: 400 })
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() }
    })

    if (!referrer || referrer.id === userId) {
      return NextResponse.json({ error: 'Código de referido inválido' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { referredById: referrer.id }
    })

    return NextResponse.json({ success: true, message: '¡Vinculado correctamente al referidor!' })
  } catch (error) {
    console.error('Error linking referral:', error)
    return NextResponse.json({ error: 'Error al vincular código de referido' }, { status: 500 })
  }
}
