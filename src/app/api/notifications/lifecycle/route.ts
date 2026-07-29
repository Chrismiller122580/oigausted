import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runLifecycleNudges } from '@/lib/marketing-lifecycle';

/**
 * Daily automated lifecycle nudges (Vercel Cron).
 * - Seller 3+ days without a gig
 * - Buyer 7+ days without an order
 *
 * Auth: CRON_SECRET bearer or admin session.
 * Query: ?dryRun=true to preview without sending.
 */
export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get('authorization');
  const isCronAuth = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronAuth) {
    const { requireAdminFromDb } = await import('@/lib/admin-auth');
    const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  try {
    const result = await runLifecycleNudges({ dryRun });
    return NextResponse.json({
      success: true,
      ...result,
      message: dryRun
        ? `Vista previa: ${result.rules.reduce((s, r) => s + r.eligible, 0)} usuarios elegibles`
        : result.enabled
          ? `Nudges enviados: ${result.totalSent}`
          : 'Nudges automáticos deshabilitados (LIFECYCLE_NUDGES_ENABLED=false)',
    });
  } catch (error) {
    console.error('Lifecycle nudge job error:', error);
    return NextResponse.json({ error: 'Failed to process lifecycle nudges' }, { status: 500 });
  }
}