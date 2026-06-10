import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';

interface BroadcastBody {
  subject: string;
  message: string;
  segment?: string; // all | buyers | sellers | active | inactive | city:xxx
  city?: string;
  dryRun?: boolean;
  testOnly?: boolean; // send only to the current admin for preview
}

function parseSegment(segment: string | undefined, city?: string) {
  const where: any = { email: { not: null }, isActive: true };

  const seg = (segment || 'all').toLowerCase();

  if (seg === 'buyers') where.role = 'buyer';
  if (seg === 'sellers') where.role = 'seller';
  if (seg === 'admins') where.role = 'admin';
  if (seg === 'inactive') {
    where.isActive = false;
  }

  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  } else if (seg.startsWith('city:')) {
    const c = seg.replace('city:', '');
    where.city = { contains: c, mode: 'insensitive' };
  }

  return where;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const adminId = (session.user as any).id;
  const adminEmail = (session.user as any).email;

  let body: BroadcastBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { subject, message, segment = 'all', city, dryRun = false, testOnly = false } = body;

  if (!subject || !message) {
    return NextResponse.json({ error: 'subject and message are required' }, { status: 400 });
  }

  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    let recipients: Array<{ id: string; email: string | null; name: string | null }> = [];

    if (testOnly) {
      // Send a test only to the admin themselves
      const me = await prisma.user.findUnique({ where: { id: adminId }, select: { id: true, email: true, name: true } });
      if (me?.email) recipients = [me as any];
    } else {
      const where = parseSegment(segment, city);

      // Base audience: active + has email
      const baseUsers = await prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true },
        orderBy: { createdAt: 'desc' },
        take: 5000, // safety cap for now
      });

      // Filter further by email + marketing preference (defensive: missing pref row = allowed)
      // IMPORTANT: select only columns guaranteed to exist (omit marketingEmails) to survive prod DB drift.
      // We default-allow marketing (as per schema @default(true)) when we cannot read the flag.
      const userIds = baseUsers.map(u => u.id);

      const prefs = await prisma.notificationPreference.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, emailEnabled: true },
      });

      const prefMap = new Map<string, any>(prefs.map((p: any) => [p.userId, p]));

      recipients = baseUsers.filter(u => {
        if (!u.email) return false;
        const p = prefMap.get(u.id);
        if (!p) return true; // no prefs row yet → default allow
        if (p.emailEnabled === false) return false;
        // marketingEmails not selected (drift protection); default to allowed
        return true;
      });
    }

    const recipientCount = recipients.length;

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        recipientCount,
        sample: recipients.slice(0, 10).map(r => ({ id: r.id, email: r.email, name: r.name })),
        segment,
        city: city || null,
      });
    }

    if (recipientCount === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No matching recipients after preference filters.' });
    }

    // Record the campaign first (for history)
    // @ts-ignore - model added in this change; run `prisma generate` after migration
    const campaign = await (prisma as any).marketingCampaign.create({
      data: {
        subject,
        message,
        segment: testOnly ? 'test-only' : (city ? `${segment}+city:${city}` : segment),
        recipientCount,
        sentById: adminId,
      },
    });

    // Send loop (best effort).
    // We call the core sendNotification with category 'marketing' + high priority.
    // - Respects emailEnabled + new marketingEmails granular pref
    // - High priority + explicit marketing path bypasses quiet hours (deliberate admin communication)
    // - Creates proper Notification rows with resendEmailId for tracking + webhook events
    let sent = 0;
    let failed = 0;

    for (const user of recipients) {
      if (!user.id) continue;
      try {
        await notifications.sendNotification({
          userId: user.id,
          category: 'marketing',
          type: 'email',
          title: subject,
          message,
          priority: 'high',
        });
        sent++;
      } catch (e) {
        console.error('Marketing send failed for', user.email, e);
        failed++;
      }
    }

    // Audit
    await logAuditEvent({
      adminId,
      action: 'ADMIN_MARKETING_BROADCAST',
      targetType: 'MarketingCampaign',
      targetId: campaign.id,
      details: {
        subject,
        segment: campaign.segment,
        recipientCount,
        sent,
        failed,
        testOnly,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      sent,
      failed,
      recipientCount,
      message: testOnly 
        ? `Test email sent to ${adminEmail}` 
        : `Sent to ${sent} recipients (${failed} failed)`,
    });
  } catch (error) {
    console.error('Marketing broadcast error:', error);
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 });
  }
}
