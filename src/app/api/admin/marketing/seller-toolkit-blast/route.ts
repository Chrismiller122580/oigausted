import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import {
  formatBroadcastSegment,
  isMissingMarketingCampaignTable,
  resolveMarketingRecipients,
} from '@/lib/marketing-audience';
import { andColombiaAudience, isCountryCodeSchemaDrift, withoutCountryCode } from '@/lib/colombia-geo';
import { applyMergeFields, getPlaybookById } from '@/lib/marketing-playbooks';
import { getPlaybookNudgedUserIds } from '@/lib/marketing-lifecycle';
import { sellerToolkitLifecycleCopy } from '@/lib/seller-buyer-toolkit-campaign';
import type { Prisma } from '@prisma/client';

export const maxDuration = 300;

const PLAYBOOK_ID = 'sellers-get-buyers-toolkit';
const BLAST_CAP = 5000;

function sellerBlastWhere(excludeIds: string[]): Prisma.UserWhereInput {
  const base = andColombiaAudience({
    email: { not: null },
    isActive: true,
    role: 'seller',
  });
  if (excludeIds.length === 0) return base;
  return { AND: [base, { id: { notIn: excludeIds } }] };
}

async function resolveBlastRecipients(excludeIds: string[]) {
  const where = sellerBlastWhere(excludeIds);
  try {
    return await resolveMarketingRecipients({ where, take: BLAST_CAP });
  } catch (err) {
    if (isCountryCodeSchemaDrift(err)) {
      return resolveMarketingRecipients({
        where: withoutCountryCode(where),
        take: BLAST_CAP,
      });
    }
    throw err;
  }
}

async function isAuthorized(req: NextRequest): Promise<{ ok: boolean; adminId?: string }> {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { ok: true, adminId: 'cron-seller-toolkit-blast' };
  }
  const session = await requireAdminPanelSession();
  if (session?.user?.id) return { ok: true, adminId: session.user.id };
  return { ok: false };
}

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const auth = await isAuthorized(req);
  if (!auth.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get('dryRun') === 'true';
  const playbook = getPlaybookById(PLAYBOOK_ID);
  if (!playbook) {
    return NextResponse.json({ error: 'Playbook not found' }, { status: 500 });
  }

  const copy = sellerToolkitLifecycleCopy();
  const alreadyNudged = await getPlaybookNudgedUserIds(PLAYBOOK_ID);
  const recipients = await resolveBlastRecipients([...alreadyNudged]);

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      playbookId: PLAYBOOK_ID,
      alreadySent: alreadyNudged.size,
      eligible: recipients.length,
      sample: recipients.slice(0, 10).map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        city: r.city,
      })),
      subject: copy.subject,
    });
  }

  if (recipients.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      message: 'Todos los vendedores alcanzables ya recibieron esta campaña.',
      alreadySent: alreadyNudged.size,
    });
  }

  const historySegment = formatBroadcastSegment({
    recipients,
    segment: playbook.segment,
  });

  let campaign: { id: string } | null = null;
  const adminId = auth.adminId!;
  try {
    if (adminId !== 'cron-seller-toolkit-blast') {
      campaign = await prisma.marketingCampaign.create({
        data: {
          subject: copy.subject,
          message: copy.message,
          segment: `${historySegment}+manual-blast`,
          recipientCount: recipients.length,
          sentById: adminId,
        },
      });
    }
  } catch (createErr) {
    if (!isMissingMarketingCampaignTable(createErr)) throw createErr;
  }

  const ctaUrl = playbook.defaultCtaUrl;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of recipients) {
    if (!user.id || !user.email) {
      skipped++;
      continue;
    }
    try {
      const personalizedSubject = applyMergeFields(copy.subject, user, { ctaUrl });
      const personalizedMessage = applyMergeFields(copy.message, user, { ctaUrl });
      const result = await notifications.sendNotification({
        userId: user.id,
        category: 'marketing',
        type: 'email',
        title: personalizedSubject,
        message: personalizedMessage,
        priority: 'high',
        data: {
          playbookId: PLAYBOOK_ID,
          ctaLabel: playbook.defaultCta,
          ctaUrl,
          manualBlast: true,
        },
      });
      if (result.skipped) skipped++;
      else sent++;
    } catch (e) {
      console.error('Seller toolkit blast failed for', user.email, e);
      failed++;
    }
  }

  if (adminId !== 'cron-seller-toolkit-blast') {
    await logAuditEvent({
      adminId,
      action: 'ADMIN_MARKETING_BROADCAST',
      targetType: 'MarketingCampaign',
      targetId: campaign?.id ?? 'seller-toolkit-manual-blast',
      details: {
        subject: copy.subject,
        segment: historySegment,
        recipientCount: recipients.length,
        sent,
        failed,
        skipped,
        manualBlast: true,
        playbookId: PLAYBOOK_ID,
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: req.headers.get('user-agent'),
    });
  }

  return NextResponse.json({
    success: true,
    dryRun: false,
    playbookId: PLAYBOOK_ID,
    recipientCount: recipients.length,
    sent,
    skipped,
    failed,
    alreadySentBefore: alreadyNudged.size,
    campaignId: campaign?.id ?? null,
    message: `Campaña vendedores enviada: ${sent} correos (${failed} fallidos, ${skipped} omitidos)`,
  });
}