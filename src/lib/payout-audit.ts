import { prisma, getPlatformConfig } from '@/lib/prisma';
import {
  calculateOrderPayout,
  aggregatePayouts,
  DEFAULT_PAYOUT_CONFIG,
  type PayoutConfig,
} from '@/lib/payout';
import { isMissingColumnError } from '@/lib/user-profile-update';
import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status';

export interface SellerMissingBank {
  id: string;
  name: string | null;
  email: string;
  businessName: string | null;
  pendingNetCOP: number;
  pendingOrderCount: number;
  missingFields: string[];
}

export interface PayoutAuditReport {
  schema: {
    sellerPayoutAt: boolean;
    wompiPayoutRef: boolean;
    payoutBankColumns: boolean;
  };
  payouts: {
    completedUnpaidCount: number;
    completedUnpaidNetCOP: number;
    completedPaidCount: number;
    oldestUnpaidAt: string | null;
  };
  referrals: {
    pendingCount: number;
    pendingAmountCOP: number;
  };
  sellersMissingBank: SellerMissingBank[];
  blockers: string[];
  healthy: boolean;
  auditedAt: string;
}

const REQUIRED_BANK_FIELDS = [
  'payoutBankCode',
  'payoutAccountNumber',
  'payoutHolderName',
  'payoutDocumentNumber',
] as const;

type BankField = (typeof REQUIRED_BANK_FIELDS)[number];

type AuditSeller = {
  id: string;
  name: string | null;
  email: string;
  businessName: string | null;
  referredById: string | null;
  payoutBankCode?: string | null;
  payoutAccountNumber?: string | null;
  payoutHolderName?: string | null;
  payoutDocumentNumber?: string | null;
};

type AuditOrder = {
  id: string;
  price: number;
  createdAt: Date;
  sellerPayoutAt?: Date | null;
  seller: AuditSeller;
};

function getMissingBankFields(seller: Partial<Record<BankField, string | null | undefined>>): string[] {
  return REQUIRED_BANK_FIELDS.filter((field) => !seller[field]?.trim());
}

async function probeColumn(
  probe: () => Promise<unknown>
): Promise<boolean> {
  try {
    await probe();
    return true;
  } catch (e) {
    if (isMissingColumnError(e)) return false;
    throw e;
  }
}

async function probeSchema(): Promise<PayoutAuditReport['schema']> {
  const [sellerPayoutAt, wompiPayoutRef, payoutBankColumns] = await Promise.all([
    probeColumn(() =>
      prisma.order.findFirst({ select: { sellerPayoutAt: true } })
    ),
    probeColumn(() =>
      prisma.order.findFirst({ select: { wompiPayoutRef: true } })
    ),
    probeColumn(() =>
      prisma.user.findFirst({ select: { payoutBankCode: true } })
    ),
  ]);

  return { sellerPayoutAt, wompiPayoutRef, payoutBankColumns };
}

async function fetchCompletedOrdersForAudit(
  schema: PayoutAuditReport['schema']
): Promise<AuditOrder[]> {
  const where = { status: labelToPrismaStatus(OrderStatusLabel.Completed) };

  const sellerSelectWithBank = {
    id: true,
    name: true,
    email: true,
    businessName: true,
    referredById: true,
    payoutBankCode: true,
    payoutAccountNumber: true,
    payoutHolderName: true,
    payoutDocumentNumber: true,
  } as const;

  const sellerSelectBasic = {
    id: true,
    name: true,
    email: true,
    businessName: true,
    referredById: true,
  } as const;

  if (schema.sellerPayoutAt && schema.payoutBankColumns) {
    return prisma.order.findMany({
      where,
      select: {
        id: true,
        price: true,
        createdAt: true,
        sellerPayoutAt: true,
        seller: { select: sellerSelectWithBank },
      },
    }) as Promise<AuditOrder[]>;
  }

  if (schema.sellerPayoutAt) {
    const rows = await prisma.order.findMany({
      where,
      select: {
        id: true,
        price: true,
        createdAt: true,
        sellerPayoutAt: true,
        seller: { select: sellerSelectBasic },
      },
    });
    return rows as AuditOrder[];
  }

  try {
    const rows = await prisma.order.findMany({
      where,
      select: {
        id: true,
        price: true,
        createdAt: true,
        seller: {
          select: schema.payoutBankColumns ? sellerSelectWithBank : sellerSelectBasic,
        },
      },
    });
    return rows.map((row) => ({ ...row, sellerPayoutAt: null })) as AuditOrder[];
  } catch (e) {
    if (!isMissingColumnError(e)) throw e;
    const rows = await prisma.order.findMany({
      where,
      select: {
        id: true,
        price: true,
        createdAt: true,
        seller: { select: sellerSelectBasic },
      },
    });
    return rows.map((row) => ({ ...row, sellerPayoutAt: null })) as AuditOrder[];
  }
}

async function getRates(): Promise<PayoutConfig> {
  const config = await getPlatformConfig();
  return {
    platformCommissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
    referralCommissionRate:
      config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
  };
}

async function fetchReferralPending(): Promise<{ pendingCount: number; pendingAmountCOP: number }> {
  const earnings = await prisma.referralEarning.findMany({
    where: { status: { in: ['Pending', 'Requested'] } },
    select: { amount: true },
  });

  return {
    pendingCount: earnings.length,
    pendingAmountCOP: earnings.reduce((sum, e) => sum + (e.amount || 0), 0),
  };
}

function buildSellersMissingBank(
  unpaidOrders: AuditOrder[],
  rates: PayoutConfig
): SellerMissingBank[] {
  const bySeller = new Map<string, SellerMissingBank & { orderIds: Set<string> }>();

  for (const order of unpaidOrders) {
    const seller = order.seller;
    const missingFields = getMissingBankFields(seller);
    if (missingFields.length === 0) continue;

    const net = calculateOrderPayout(
      Number(order.price) || 0,
      !!seller.referredById,
      rates
    ).netToSeller;

    const existing = bySeller.get(seller.id);
    if (existing) {
      existing.pendingNetCOP += net;
      existing.pendingOrderCount += 1;
      existing.orderIds.add(order.id);
      continue;
    }

    bySeller.set(seller.id, {
      id: seller.id,
      name: seller.name,
      email: seller.email,
      businessName: seller.businessName,
      pendingNetCOP: net,
      pendingOrderCount: 1,
      missingFields,
      orderIds: new Set([order.id]),
    });
  }

  return [...bySeller.values()]
    .map((entry) => {
      const { orderIds, ...rest } = entry;
      void orderIds;
      return rest;
    })
    .sort((a, b) => b.pendingNetCOP - a.pendingNetCOP);
}

export async function runPayoutAudit(): Promise<PayoutAuditReport> {
  const schema = await probeSchema();
  const rates = await getRates();
  const orders = await fetchCompletedOrdersForAudit(schema);

  const unpaidOrders = schema.sellerPayoutAt
    ? orders.filter((o) => !o.sellerPayoutAt)
    : orders;

  const paidOrders = schema.sellerPayoutAt
    ? orders.filter((o) => !!o.sellerPayoutAt)
    : [];

  const unpaidBreakdowns = unpaidOrders.map((o) =>
    calculateOrderPayout(Number(o.price) || 0, !!o.seller.referredById, rates)
  );
  const unpaidAggregated = aggregatePayouts(unpaidBreakdowns);

  const oldestUnpaid = unpaidOrders.length
    ? unpaidOrders.reduce((oldest, o) => (o.createdAt < oldest ? o.createdAt : oldest), unpaidOrders[0].createdAt)
    : null;

  const referrals = await fetchReferralPending();
  const sellersMissingBank = buildSellersMissingBank(unpaidOrders, rates);

  const blockers: string[] = [];

  if (!schema.sellerPayoutAt) {
    blockers.push(
      'Order.sellerPayoutAt column is missing. Run prisma migrate deploy (migration 20260618120000_add_seller_payout_at).'
    );
  }
  if (!schema.wompiPayoutRef) {
    blockers.push(
      'Order.wompiPayoutRef column is missing. Run prisma migrate deploy (migration 20260614000000).'
    );
  }
  if (!schema.payoutBankColumns) {
    blockers.push(
      'User payout bank columns are missing. Sellers cannot save bank details until migration is applied.'
    );
  }
  if (!schema.sellerPayoutAt && unpaidOrders.length > 0) {
    blockers.push(
      `${unpaidOrders.length} completed order(s) cannot be reliably tracked as paid until sellerPayoutAt exists.`
    );
  }
  if (sellersMissingBank.length > 0) {
    blockers.push(
      `${sellersMissingBank.length} seller(s) have pending payouts but incomplete bank details.`
    );
  }

  const healthy =
    schema.sellerPayoutAt &&
    schema.wompiPayoutRef &&
    schema.payoutBankColumns &&
    sellersMissingBank.length === 0;

  return {
    schema,
    payouts: {
      completedUnpaidCount: unpaidOrders.length,
      completedUnpaidNetCOP: unpaidAggregated.netToSeller,
      completedPaidCount: paidOrders.length,
      oldestUnpaidAt: oldestUnpaid ? oldestUnpaid.toISOString() : null,
    },
    referrals,
    sellersMissingBank,
    blockers,
    healthy,
    auditedAt: new Date().toISOString(),
  };
}