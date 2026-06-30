import { NextResponse } from 'next/server';
import { requireFinancePanelSession } from '@/lib/admin-auth';
import { getPlatformConfig } from '@/lib/prisma';
import { runPayoutAudit } from '@/lib/payout-audit';
import { DEFAULT_PAYOUT_CONFIG } from '@/lib/payout';

export async function GET() {
  try {
    const session = await requireFinancePanelSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [config, audit] = await Promise.all([getPlatformConfig(), runPayoutAudit()]);

    const wompiPublic = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
    let wompiMode: 'live' | 'sandbox' | 'missing' = 'missing';
    if (wompiPublic) {
      wompiMode =
        wompiPublic.includes('test') || wompiPublic.includes('_test_') ? 'sandbox' : 'live';
    }

    return NextResponse.json({
      commissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
      referralCommissionRate:
        config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
      wompiRealPaymentsEnabled: config?.wompiRealPaymentsEnabled ?? false,
      wompiSftpEnabled: config?.wompiSftpEnabled ?? false,
      wompiMode,
      wompiConfigured: !!wompiPublic && !!process.env.WOMPI_INTEGRITY_KEY,
      payoutSchema: audit.schema,
      payoutsHealthy: audit.healthy,
      pendingPayoutCount: audit.payouts.completedUnpaidCount,
      pendingPayoutNetCOP: audit.payouts.completedUnpaidNetCOP,
    });
  } catch (error) {
    console.error('Accountant settings error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}