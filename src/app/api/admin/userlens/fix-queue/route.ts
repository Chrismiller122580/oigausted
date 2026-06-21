import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin-auth';
import { listFixQueueItems } from '@/lib/userlens/reports-store';
import type { FixItemStatus } from '@/types/userlens';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: FixItemStatus[] = [
  'pending',
  'approved',
  'rejected',
  'deferred',
  'fixed',
];

export async function GET(req: NextRequest) {
  const session = await requireAdminFromDb();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const statusParam = req.nextUrl.searchParams.get('status');
  const status = VALID_STATUSES.includes(statusParam as FixItemStatus)
    ? (statusParam as FixItemStatus)
    : undefined;

  const items = await listFixQueueItems({ status });
  return NextResponse.json({ items });
}