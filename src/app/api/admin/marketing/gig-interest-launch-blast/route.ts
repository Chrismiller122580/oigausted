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
import {
  BUYER_GIG_INTEREST_PLAYBOOK_ID,
  SELLER_GIG_INTEREST_PLAYBOOK_ID,
  buyerGigInterestLifecycleCopy,
  sellerGigInterestLifecycleCopy,
} from '@/lib/gig-interest-launch-campaign';
import type { Prisma } from '@prisma/client';

export const maxDuration = 300;

const BLAST_CAP = 5000;

type Role = 'seller' | 'buyer';

function audienceWhere(role: Role, excludeIds: string[]): Prisma.UserWhereInput {
  const base = andColombiaAudience({
    email: { not: null },
    isActive: true,
    role,
  });
  if (excludeIds.length === 0) return base;
  return { AND: [base, { id: { notIn: excludeIds } }] };
}

async function resolveBlastRecipients(role: Role, excludeIds: string[]) {
  const where = audienceWhere(role, excludeIds);
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
    return { ok: true, adminId: 'cron-gig-interest-launch-blast' };
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
  const sellerPlaybook = getPlaybookById(SELLER_GIG_INTEREST_PLAYBOOK_ID);
  const buyerPlaybook = getPlaybookById(BUYER_GIG_INTEREST_PLAYBOOK_ID);
  if (!sellerPlaybook || !buyerPlaybook) {
    return NextResponse.json({ error: 'Playbook not found' }, { status: 500 });
  }

  const sellerCopy = sellerGigInterestLifecycleCopy();
  const buyerCopy = buyerGigInterestLifecycleCopy();
  const sellersAlready = await getPlaybookNudgedUserIds(SELLER_GIG_INTEREST_PLAYBOOK_ID);
  const buyersAlready = await getPlaybookNudgedUserIds(BUYER_GIG_INTEREST_PLAYBOOK_ID);
  const sellers = await resolveBlastRecipients('seller', [...sellersAlready]);
  const buyers = await resolveBlastRecipients('buyer', [...buyersAlready]);

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      playbookIds: [SELLER_GIG_INTEREST_PLAYBOOK_ID, BUYER_GIG_INTEREST_PLAYBOOK_ID],
      sellers: {
        alreadySent: sellersAlready.size,
        eligible: sellers.length,
        subject: sellerCopy.subject,
        sample: sellers.slice(0, 5).map((r) => ({ id: r.id, email: r.email, name: r.name })),
      },
      buyers: {
        alreadySent: buyersAlready.size,
        eligible: buyers.length,
        subject: buyerCopy.subject,
        sample: buyers.slice(0, 5).map((r) => ({ id: r.id, email: r.email, name: r.name })),
      },
      eligible: sellers.length + buyers.length,
    });
  }

  if (sellers.length + buyers.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      message: 'Todos los usuarios alcanzables ya recibieron este aviso.',
      alreadySent: sellersAlready.size + buyersAlready.size,
    });
  }

  const historySegment = formatBroadcastSegment({
    recipients: [...sellers, ...buyers],
    segment: 'gig-interest-launch',
  });

  let campaign: { id: string } | null = null;
  const adminId = auth.adminId!;
  try {
    if (!adminId.startsWith('cron-')) {
      campaign = await prisma.marketingCampaign.create({
        data: {
          subject: 'Herramienta nueva: me gusta, visitas y Ver gig',
          message: `${sellerCopy.message}\n\n---\n\n${buyerCopy.message}`,
          segment: `${historySegment}+manual-blast`,
          recipientCount: sellers.length + buyers.length,
          sentById: adminId,
        },
      });
    }
  } catch (createErr) {
    if (!isMissingMarketingCampaignTable(createErr)) throw createErr;
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  async function sendGroup(
    users: typeof sellers,
    playbook: NonNullable<typeof sellerPlaybook>,
    copy: { subject: string; message: string },
  ) {
    for (const user of users) {
      if (!user.id || !user.email) {
        skipped++;
        continue;
      }
      try {
        const personalizedSubject = applyMergeFields(copy.subject, user, {
          ctaUrl: playbook.defaultCtaUrl,
        });
        const personalizedMessage = applyMergeFields(copy.message, user, {
          ctaUrl: playbook.defaultCtaUrl,
        });
        const result = await notifications.sendNotification({
          userId: user.id,
          category: 'marketing',
          type: 'email',
          title: personalizedSubject,
          message: personalizedMessage,
          priority: 'high',
          channels: 'both',
          link: playbook.defaultCtaUrl.replace(/^https?:\/\/[^/]+/, '') || '/gigs',
          data: {
            playbookId: playbook.id,
            ctaLabel: playbook.defaultCta,
            ctaUrl: playbook.defaultCtaUrl,
            manualBlast: true,
          },
        });
        if (result.skipped) skipped++;
        else sent++;
      } catch (e) {
        console.error('Gig interest launch blast failed for', user.email, e);
        failed++;
      }
    }
  }

  await sendGroup(sellers, sellerPlaybook, sellerCopy);
  await sendGroup(buyers, buyerPlaybook, buyerCopy);

  if (!adminId.startsWith('cron-')) {
    await logAuditEvent({
      adminId,
      action: 'ADMIN_MARKETING_BROADCAST',
      targetType: 'MarketingCampaign',
      targetId: campaign?.id ?? 'gig-interest-launch-manual-blast',
      details: {
        subject: 'Herramienta nueva: me gusta, visitas y Ver gig',
        segment: historySegment,
        recipientCount: sellers.length + buyers.length,
        sellers: sellers.length,
        buyers: buyers.length,
        sent,
        failed,
        skipped,
        manualBlast: true,
        playbookIds: [SELLER_GIG_INTEREST_PLAYBOOK_ID, BUYER_GIG_INTEREST_PLAYBOOK_ID],
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      userAgent: req.headers.get('user-agent'),
    });
  }

  return NextResponse.json({
    success: true,
    dryRun: false,
    playbookIds: [SELLER_GIG_INTEREST_PLAYBOOK_ID, BUYER_GIG_INTEREST_PLAYBOOK_ID],
    recipientCount: sellers.length + buyers.length,
    sellers: sellers.length,
    buyers: buyers.length,
    sent,
    skipped,
    failed,
    campaignId: campaign?.id ?? null,
    message: `Aviso de la herramienta enviado: ${sent} (vendedores ${sellers.length}, compradores ${buyers.length}; ${failed} fallidos, ${skipped} omitidos)`,
  });
}
