import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromDb } from '@/lib/admin-auth'
import { scrubMarketplaceContacts } from '@/lib/scrub-marketplace-contacts'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function authorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  const session = await requireAdminFromDb()
  return Boolean(session?.user?.id)
}

/** Vercel Cron is GET + Bearer CRON_SECRET. Default apply; ?dryRun=true previews. */
export async function GET(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const dryRun = new URL(req.url).searchParams.get('dryRun') === 'true'
  const report = await scrubMarketplaceContacts({ dryRun })
  return NextResponse.json(report)
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const dryRun = new URL(req.url).searchParams.get('dryRun') === 'true'
  const report = await scrubMarketplaceContacts({ dryRun })
  return NextResponse.json(report)
}
