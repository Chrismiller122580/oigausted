import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import {
  buildAudienceWhere,
  formatBroadcastSegment,
  isMissingMarketingCampaignTable,
  resolveMarketingRecipients,
} from '@/lib/marketing-audience';
import { applyMergeFields, getPlaybookById, parsePlaybookId } from '@/lib/marketing-playbooks';

interface BroadcastBody {
  subject: string;
  message: string;
  segment?: string;
  city?: string;
  userIds?: string[];
  playbookId?: string;
  dryRun?: boolean;
  testOnly?: boolean;
}

function parseSegment(segment: string | undefined, city?: string) {
  const seg = (segment || 'all').toLowerCase();
  if (!city && seg.startsWith('city:')) {
    return buildAudienceWhere('all', seg.replace('city:', ''));
  }
  return buildAudienceWhere(segment || 'all', city);
}

export async function POST(req: NextRequest) {
  const session = await requireAdminPanelSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const adminId = session.user.id;
  const adminEmail = session.user.email;

  let body: BroadcastBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    subject,
    message,
    segment = 'all',
    city,
    userIds,
    playbookId,
    dryRun = false,
    testOnly = false,
  } = body;

  const resolvedPlaybookId = playbookId || parsePlaybookId(segment || '') || undefined;
  const playbook = resolvedPlaybookId ? getPlaybookById(resolvedPlaybookId) : undefined;

  if (!subject || !message) {
    return NextResponse.json({ error: 'subject and message are required' }, { status: 400 });
  }

  if (userIds && userIds.length === 0) {
    return NextResponse.json({ error: 'userIds must not be empty' }, { status: 400 });
  }

  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    let recipients: Awaited<ReturnType<typeof resolveMarketingRecipients>> = [];

    if (testOnly) {
      const me = await prisma.user.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, name: true },
      });
      if (me?.email) recipients = [me];
    } else if (userIds && userIds.length > 0) {
      recipients = await resolveMarketingRecipients({ userIds });
    } else {
      const where = parseSegment(segment, city);
      recipients = await resolveMarketingRecipients({ where });
    }

    const recipientCount = recipients.length;
    const historySegment = formatBroadcastSegment({
      testOnly,
      userIds,
      recipients,
      segment,
      city,
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        recipientCount,
        sample: recipients.slice(0, 10).map((r) => ({ id: r.id, email: r.email, name: r.name })),
        segment: historySegment,
        city: city || null,
        userIds: userIds || null,
      });
    }

    if (recipientCount === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No hay destinatarios alcanzables después de aplicar filtros de preferencias.',
      });
    }

    let campaign: { id: string; segment: string } | null = null;
    try {
      campaign = await prisma.marketingCampaign.create({
        data: {
          subject,
          message,
          segment: historySegment,
          recipientCount,
          sentById: adminId,
        },
      });
    } catch (createErr) {
      if (!isMissingMarketingCampaignTable(createErr)) throw createErr;
      console.warn('MarketingCampaign table missing; broadcast will send without history record.');
    }

    let sent = 0;
    let failed = 0;

    const ctaUrl = playbook?.defaultCtaUrl;

    for (const user of recipients) {
      if (!user.id) continue;
      try {
        const personalizedSubject = applyMergeFields(subject, user, { ctaUrl });
        const personalizedMessage = applyMergeFields(message, user, { ctaUrl });
        await notifications.sendNotification({
          userId: user.id,
          category: 'marketing',
          type: 'email',
          title: personalizedSubject,
          message: personalizedMessage,
          priority: 'high',
          data: playbook
            ? {
                playbookId: playbook.id,
                ctaLabel: playbook.defaultCta,
                ...(ctaUrl ? { ctaUrl } : {}),
              }
            : undefined,
        });
        sent++;
      } catch (e) {
        console.error('Marketing send failed for', user.email, e);
        failed++;
      }
    }

    await logAuditEvent({
      adminId,
      action: 'ADMIN_MARKETING_BROADCAST',
      targetType: 'MarketingCampaign',
      targetId: campaign?.id ?? 'pending-migration',
      details: {
        subject,
        segment: campaign?.segment ?? historySegment,
        recipientCount,
        sent,
        failed,
        testOnly,
        userIds: userIds || null,
        historyRecorded: Boolean(campaign),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign?.id ?? null,
      sent,
      failed,
      recipientCount,
      message: testOnly
        ? `Correo de prueba enviado a ${adminEmail}`
        : userIds && userIds.length === 1
          ? `Enviado a ${recipients[0]?.email ?? 'usuario'} (${sent} exitoso, ${failed} fallido)`
          : `Enviado a ${sent} destinatarios (${failed} fallidos)`,
    });
  } catch (error) {
    console.error('Marketing broadcast error:', error);
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 });
  }
}