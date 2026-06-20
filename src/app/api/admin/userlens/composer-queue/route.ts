import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/userlens/admin-auth';
import {
  buildComposerQueue,
  getComposerQueuePath,
  syncComposerQueueFile,
} from '@/lib/userlens/reports-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const queue = await buildComposerQueue();
  return NextResponse.json({
    queue,
    filePath: getComposerQueuePath(),
  });
}

export async function POST() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const queue = await syncComposerQueueFile();
  return NextResponse.json({
    ok: true,
    updatedAt: queue.updatedAt,
    fixQueueCount: queue.fixQueue.length,
    filePath: getComposerQueuePath(),
  });
}