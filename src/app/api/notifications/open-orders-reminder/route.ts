import { NextRequest, NextResponse } from 'next/server'
import { processSellerOpenOrdersReminders } from '@/lib/seller-open-orders-reminder'
import { processBuyerOpenOrdersReminders } from '@/lib/buyer-open-orders-reminder'

/**
 * Daily open-order reminders (Vercel Cron).
 * - Sellers: Paid / In Progress
 * - Buyers: Pending / Paid / In Progress
 * One nudge per role per day until orders are closed.
 *
 * Auth: CRON_SECRET bearer or admin session.
 * Query: ?dryRun=true to preview without sending.
 *         ?role=seller|buyer to run only one side (default: both).
 */
export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authHeader = req.headers.get('authorization')
  const isCronAuth = !!cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCronAuth) {
    const { requireAdminFromDb } = await import('@/lib/admin-auth')
    const session = await requireAdminFromDb()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const dryRun = searchParams.get('dryRun') === 'true'
  const roleFilter = searchParams.get('role') // seller | buyer | null (both)

  try {
    const runSellers = !roleFilter || roleFilter === 'seller'
    const runBuyers = !roleFilter || roleFilter === 'buyer'

    const sellers = runSellers
      ? await processSellerOpenOrdersReminders({ dryRun })
      : null
    const buyers = runBuyers
      ? await processBuyerOpenOrdersReminders({ dryRun })
      : null

    const totalSent = (sellers?.sent ?? 0) + (buyers?.sent ?? 0)
    const totalEligible = (sellers?.eligible ?? 0) + (buyers?.eligible ?? 0)
    const totalSkipped = (sellers?.skipped ?? 0) + (buyers?.skipped ?? 0)
    const totalFailed = (sellers?.failed ?? 0) + (buyers?.failed ?? 0)

    return NextResponse.json({
      success: true,
      dryRun,
      sellers,
      buyers,
      totalSent,
      totalEligible,
      totalSkipped,
      totalFailed,
      message: dryRun
        ? `Vista previa: ${totalEligible} usuarios con pedidos abiertos (vendedores: ${sellers?.eligible ?? 0}, compradores: ${buyers?.eligible ?? 0})`
        : `Recordatorios enviados: ${totalSent} (vendedores: ${sellers?.sent ?? 0}, compradores: ${buyers?.sent ?? 0}; omitidos: ${totalSkipped}, fallidos: ${totalFailed})`,
    })
  } catch (error) {
    console.error('Open-orders reminder job error:', error)
    return NextResponse.json(
      { error: 'Failed to process open-orders reminders' },
      { status: 500 },
    )
  }
}
