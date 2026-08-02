import { NextRequest, NextResponse } from 'next/server'
import { processSellerOpenOrdersReminders } from '@/lib/seller-open-orders-reminder'

/**
 * Daily seller open-order reminders (Vercel Cron).
 * Notifies sellers with Paid / In Progress orders once per day until closed.
 *
 * Auth: CRON_SECRET bearer or admin session.
 * Query: ?dryRun=true to preview without sending.
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

  try {
    const result = await processSellerOpenOrdersReminders({ dryRun })
    return NextResponse.json({
      success: true,
      ...result,
      message: dryRun
        ? `Vista previa: ${result.eligible} vendedores con pedidos abiertos (sin enviar)`
        : `Recordatorios enviados: ${result.sent} (omitidos: ${result.skipped}, fallidos: ${result.failed})`,
    })
  } catch (error) {
    console.error('Open-orders reminder job error:', error)
    return NextResponse.json(
      { error: 'Failed to process open-orders reminders' },
      { status: 500 },
    )
  }
}
