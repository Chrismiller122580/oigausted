import { NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin-auth';
import { runPayoutAudit } from '@/lib/payout-audit';
import { devLog } from '@/lib/utils';

export async function GET() {
  try {
    const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const report = await runPayoutAudit();
    return NextResponse.json(report);
  } catch (error) {
    devLog('Payout audit error:', error);
    return NextResponse.json({ error: 'Failed to run payout audit' }, { status: 500 });
  }
}