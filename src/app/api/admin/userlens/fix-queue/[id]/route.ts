import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';
import { requireAdminSession } from '@/lib/userlens/admin-auth';
import { updateFixItemStatus } from '@/lib/userlens/reports-store';
import type { FixItemStatus } from '@/types/userlens';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: FixItemStatus[] = [
  'pending',
  'approved',
  'rejected',
  'deferred',
  'fixed',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: FixItemStatus; reviewNotes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
  }

  try {
    const item = await updateFixItemStatus(
      id,
      body.status,
      session.user.id,
      body.reviewNotes,
    );

    await logAuditEvent({
      performedById: session.user.id,
      action: 'USERLENS_FIX_REVIEW',
      targetType: 'UserLensFixItem',
      targetId: id,
      details: {
        status: body.status,
        title: item.title,
        reportId: item.reportId,
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Fix item not found' }, { status: 404 });
  }
}