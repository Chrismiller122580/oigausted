import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin-auth';
import { authOptions } from '@/lib/auth';
import { syncWompiSftpReports } from '@/lib/wompi-sftp';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await syncWompiSftpReports();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}