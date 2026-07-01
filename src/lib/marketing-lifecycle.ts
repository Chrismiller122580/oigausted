import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { notifications } from '@/lib/notifications';
import { resolveMarketingRecipients } from '@/lib/marketing-audience';
import {
  applyMergeFields,
  getPlaybookById,
  type MarketingPlaybook,
} from '@/lib/marketing-playbooks';

const DEFAULT_MAX_PER_RULE = 100;

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export type LifecycleRuleResult = {
  playbookId: string;
  label: string;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  sample?: Array<{ id: string; email: string | null; name: string | null }>;
};

export type LifecycleRunResult = {
  dryRun: boolean;
  enabled: boolean;
  rules: LifecycleRuleResult[];
  totalSent: number;
};

type LifecycleRule = {
  playbookId: string;
  buildWhere: () => Prisma.UserWhereInput;
};

/** Automated daily nudges — seller day 3+, buyer day 7+. */
export const AUTOMATED_LIFECYCLE_RULES: LifecycleRule[] = [
  {
    playbookId: 'sellers-new-no-gig',
    buildWhere: () => {
      const playbook = getPlaybookById('sellers-new-no-gig');
      return playbook ? playbook.buildWhere() : { id: 'impossible' };
    },
  },
  {
    playbookId: 'buyers-no-orders',
    buildWhere: () => ({
      email: { not: null },
      isActive: true,
      role: 'buyer',
      ordersAsBuyer: { none: {} },
      createdAt: { lte: subDays(new Date(), 7) },
    }),
  },
];

const LIFECYCLE_EMAIL_COPY: Record<string, { subject: string; message: string }> = {
  'sellers-new-no-gig': {
    subject: '¿Listo para recibir clientes? Publica tu primer gig',
    message: `Hola {{name}},

Llevas más de 3 días como vendedor en OigaGIG y notamos que aún no publicaste ningún servicio. Sin un gig, los compradores no pueden encontrarte ni contratarte.

Publicar toma menos de 5 minutos:
1. Entra a Crear gig y elige tu categoría (plomería, belleza, electricidad…)
2. Agrega un título claro, tu precio y una foto de tu trabajo
3. Publica — aparecerás en búsquedas de {{city}}

👉 Crear mi primer servicio: {{ctaUrl}}

¿Tienes dudas? Escríbenos a support@oigagig.com.

— El equipo de OigaGIG`,
  },
  'buyers-no-orders': {
    subject: 'Descubre servicios locales de confianza en OigaGIG',
    message: `Hola {{name}},

Hace más de una semana te uniste a OigaGIG y queremos ayudarte a encontrar el servicio que necesitas en {{city}}.

Así puedes hacer tu primer pedido:
1. Explora servicios por categoría o ciudad
2. Compara opciones con reseñas reales de otros clientes
3. Pide y paga de forma segura con Wompi

👉 Explorar servicios: {{ctaUrl}}

— El equipo de OigaGIG`,
  },
};

export function isLifecycleNudgesEnabled(): boolean {
  const flag = process.env.LIFECYCLE_NUDGES_ENABLED?.trim().toLowerCase();
  return flag !== 'false' && flag !== '0';
}

/** Users who already received any email for this playbook (manual broadcast or prior cron). */
export async function getPlaybookNudgedUserIds(playbookId: string): Promise<Set<string>> {
  try {
    const rows = await prisma.notification.findMany({
      where: {
        category: 'marketing',
        data: {
          path: ['playbookId'],
          equals: playbookId,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    return new Set(rows.map((r: { userId: string }) => r.userId));
  } catch (err) {
    console.warn('Lifecycle nudge dedup query failed; scanning recent notifications.', err);
    const recent = await prisma.notification.findMany({
      where: { category: 'marketing' },
      select: { userId: true, data: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
    const ids = new Set<string>();
    for (const row of recent) {
      const data = row.data as Record<string, unknown> | null;
      if (data?.playbookId === playbookId) ids.add(row.userId);
    }
    return ids;
  }
}

async function processRule(
  rule: LifecycleRule,
  playbook: MarketingPlaybook,
  opts: { dryRun: boolean; maxPerRule: number },
): Promise<LifecycleRuleResult> {
  const alreadyNudged = await getPlaybookNudgedUserIds(rule.playbookId);
  const baseWhere = rule.buildWhere();

  const excludeIds = [...alreadyNudged];
  const where: Prisma.UserWhereInput = excludeIds.length
    ? { AND: [baseWhere, { id: { notIn: excludeIds } }] }
    : baseWhere;

  const recipients = await resolveMarketingRecipients({
    where,
    take: opts.maxPerRule,
  });

  const copy = LIFECYCLE_EMAIL_COPY[rule.playbookId];
  const result: LifecycleRuleResult = {
    playbookId: rule.playbookId,
    label: playbook.label,
    eligible: recipients.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  if (opts.dryRun) {
    result.sample = recipients.slice(0, 5).map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
    }));
    return result;
  }

  const ctaUrl = playbook.defaultCtaUrl;

  for (const user of recipients) {
    if (!user.id || !user.email) {
      result.skipped++;
      continue;
    }
    try {
      const personalizedSubject = applyMergeFields(copy.subject, user, { ctaUrl });
      const personalizedMessage = applyMergeFields(copy.message, user, { ctaUrl });
      const sendResult = await notifications.sendNotification({
        userId: user.id,
        category: 'marketing',
        type: 'email',
        title: personalizedSubject,
        message: personalizedMessage,
        priority: 'normal',
        data: {
          playbookId: playbook.id,
          ctaLabel: playbook.defaultCta,
          ctaUrl,
          lifecycleNudge: true,
          automated: true,
        },
      });
      if (sendResult.skipped) {
        result.skipped++;
      } else {
        result.sent++;
      }
    } catch (e) {
      console.error('Lifecycle nudge failed for', user.email, e);
      result.failed++;
    }
  }

  return result;
}

export async function runLifecycleNudges(opts?: {
  dryRun?: boolean;
  maxPerRule?: number;
}): Promise<LifecycleRunResult> {
  const dryRun = opts?.dryRun ?? false;
  const maxPerRule = opts?.maxPerRule ?? DEFAULT_MAX_PER_RULE;
  const enabled = isLifecycleNudgesEnabled();

  if (!enabled && !dryRun) {
    return { dryRun: false, enabled: false, rules: [], totalSent: 0 };
  }

  const rules: LifecycleRuleResult[] = [];

  for (const rule of AUTOMATED_LIFECYCLE_RULES) {
    const playbook = getPlaybookById(rule.playbookId);
    if (!playbook) continue;
    const ruleResult = await processRule(rule, playbook, { dryRun, maxPerRule });
    rules.push(ruleResult);
  }

  const totalSent = rules.reduce((sum, r) => sum + r.sent, 0);

  return { dryRun, enabled, rules, totalSent };
}