import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import {
  buildAudienceWhere,
  formatBroadcastSegment,
  isMissingMarketingCampaignTable,
  resolveAudienceWhere,
  resolveMarketingRecipients,
  type AudienceGeoScope,
  type AudiencePrefMode,
  type MarketingRecipient,
} from '@/lib/marketing-audience';
import { applyMergeFields, getPlaybookById, parsePlaybookId } from '@/lib/marketing-playbooks';

/** Large segment sends can take several minutes. */
export const maxDuration = 300;

const BATCH_SIZE = 10;
const MAX_RETRIES = 1;

interface BroadcastBody {
  subject: string;
  message: string;
  segment?: string;
  city?: string;
  userIds?: string[];
  playbookId?: string;
  dryRun?: boolean;
  testOnly?: boolean;
  /** marketing (promos) or ops (system / policy / outage announcements) */
  mode?: AudiencePrefMode | 'system';
  /** colombia (default) or all countries */
  geoScope?: AudienceGeoScope;
}

function parseSegment(
  segment: string | undefined,
  city?: string,
  geoScope: AudienceGeoScope = 'colombia',
) {
  const seg = (segment || 'all').toLowerCase();
  if (!city && seg.startsWith('city:')) {
    return buildAudienceWhere('all', { city: seg.replace('city:', ''), geoScope });
  }
  return buildAudienceWhere(segment || 'all', { city, geoScope });
}

function normalizeMode(raw: BroadcastBody['mode']): AudiencePrefMode {
  if (raw === 'ops' || raw === 'system') return 'ops';
  return 'marketing';
}

async function sendOne(
  user: MarketingRecipient,
  opts: {
    subject: string;
    message: string;
    mode: AudiencePrefMode;
    playbook: ReturnType<typeof getPlaybookById> | undefined;
    ctaUrl: string | undefined;
  },
): Promise<'sent' | 'failed'> {
  if (!user.id) return 'failed';
  const personalizedSubject = applyMergeFields(opts.subject, user, { ctaUrl: opts.ctaUrl });
  const personalizedMessage = applyMergeFields(opts.message, user, { ctaUrl: opts.ctaUrl });

  const category = opts.mode === 'ops' ? 'system' : 'marketing';
  const data: Record<string, string | boolean> | undefined =
    opts.mode === 'ops'
      ? { kind: 'ops_broadcast', opsAnnouncement: true }
      : opts.playbook
        ? {
            playbookId: opts.playbook.id,
            ctaLabel: opts.playbook.defaultCta,
            ...(opts.ctaUrl ? { ctaUrl: opts.ctaUrl } : {}),
          }
        : undefined;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await notifications.sendNotification({
        userId: user.id,
        category,
        type: 'email',
        title: personalizedSubject,
        message: personalizedMessage,
        priority: 'high',
        channels: 'both',
        data,
      });
      return 'sent';
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
      }
    }
  }
  console.error('Broadcast send failed for', user.email, lastErr);
  return 'failed';
}

/** Run recipient sends in concurrent batches with light retry. */
async function sendInBatches(
  recipients: MarketingRecipient[],
  opts: {
    subject: string;
    message: string;
    mode: AudiencePrefMode;
    playbook: ReturnType<typeof getPlaybookById> | undefined;
    ctaUrl: string | undefined;
  },
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((user) => sendOne(user, opts)));
    for (const r of results) {
      if (r === 'sent') sent++;
      else failed++;
    }
  }

  return { sent, failed };
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

  const mode = normalizeMode(body.mode);
  const geoScope: AudienceGeoScope = body.geoScope === 'all' ? 'all' : 'colombia';

  const resolvedPlaybookId = playbookId || parsePlaybookId(segment || '') || undefined;
  const playbook = resolvedPlaybookId ? getPlaybookById(resolvedPlaybookId) : undefined;

  if (!subject || !message) {
    return NextResponse.json({ error: 'subject and message are required' }, { status: 400 });
  }

  if (userIds && userIds.length === 0) {
    return NextResponse.json({ error: 'userIds must not be empty' }, { status: 400 });
  }

  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    let recipients: MarketingRecipient[] = [];

    if (testOnly) {
      const me = await prisma.user.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, name: true },
      });
      if (me?.email) recipients = [me];
    } else if (userIds && userIds.length > 0) {
      recipients = await resolveMarketingRecipients({
        userIds,
        prefMode: mode,
        geoScope,
      });
    } else {
      const where = await resolveAudienceWhere(parseSegment(segment, city, geoScope));
      recipients = await resolveMarketingRecipients({
        where,
        prefMode: mode,
        geoScope,
      });
    }

    const recipientCount = recipients.length;
    const historySegment = formatBroadcastSegment({
      testOnly,
      userIds,
      recipients,
      segment,
      city,
      mode,
      geoScope,
    });

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        recipientCount,
        sample: recipients.slice(0, 10).map((r) => ({ id: r.id, email: r.email, name: r.name })),
        segment: historySegment,
        city: city || null,
        userIds: userIds || null,
        mode,
        geoScope,
      });
    }

    if (recipientCount === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        mode,
        geoScope,
        message:
          mode === 'ops'
            ? 'No hay destinatarios alcanzables (email desactivado o sin correo).'
            : 'No hay destinatarios alcanzables después de aplicar filtros de preferencias.',
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

    const ctaUrl = playbook?.defaultCtaUrl;
    const { sent, failed } = await sendInBatches(recipients, {
      subject,
      message,
      mode,
      playbook,
      ctaUrl,
    });

    await logAuditEvent({
      adminId,
      action: mode === 'ops' ? 'ADMIN_OPS_BROADCAST' : 'ADMIN_MARKETING_BROADCAST',
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
        mode,
        geoScope,
        batchSize: BATCH_SIZE,
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
      mode,
      geoScope,
      message: testOnly
        ? `Correo de prueba enviado a ${adminEmail}`
        : userIds && userIds.length === 1
          ? `Enviado a ${recipients[0]?.email ?? 'usuario'} (${sent} exitoso, ${failed} fallido)`
          : `Enviado a ${sent} destinatarios (${failed} fallidos)${mode === 'ops' ? ' · modo ops' : ''}`,
    });
  } catch (error) {
    console.error('Marketing broadcast error:', error);
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 });
  }
}
