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

async function run(req: NextRequest, fallbackDryRun: boolean) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const url = new URL(req.url)
  const dryRun =
    url.searchParams.get('dryRun') === 'true' ||
    (url.searchParams.get('apply') !== '1' && fallbackDryRun && url.searchParams.get('dryRun') !== 'false')
  const apply = url.searchParams.get('apply') === '1' || url.searchParams.get('dryRun') === 'false'
  const report = await scrubMarketplaceContacts({
    dryRun: apply ? false : dryRun,
  })
  return NextResponse.json(report)
}

/** Vercel Cron is GET + Bearer CRON_SECRET. Default apply so the weekly job writes. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') === 'true'
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const report = await scrubMarketplaceContacts({ dryRun })
  return NextResponse.json(report)
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') === 'true'
  const report = await scrubMarketplaceContacts({ dryRun })
  return NextResponse.json(report)
}
