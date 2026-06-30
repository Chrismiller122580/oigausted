import { NextRequest, NextResponse } from 'next/server';
import { requireFinancePanelSession } from '@/lib/admin-auth';
import { lookupUserPayoutsByEmail, runPayoutAudit } from '@/lib/payout-audit';
import { devLog } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireFinancePanelSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const email = new URL(req.url).searchParams.get('email')?.trim();
    if (email) {
      const lookup = await lookupUserPayoutsByEmail(email);
      return NextResponse.json(lookup);
    }

    const report = await runPayoutAudit();
    return NextResponse.json(report);
  } catch (error) {
    devLog('Payout audit error:', error);
    return NextResponse.json({ error: 'Failed to run payout audit' }, { status: 500 });
  }
}