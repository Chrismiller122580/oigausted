/**
 * Payout Calculation Utilities - Single Source of Truth for Accounting
 *
 * Accounting Model (Fixed):
 * - Buyer pays `grossAmount` (full order price).
 * - Platform keeps `platformFee` = gross * commissionRate (default 12%).
 * - If the seller was referred by someone:
 *     - A `referralFee` = gross * referralCommissionRate (default 5%) is owed to the referrer.
 *     - This referral fee is treated as a **platform expense** (paid from platform margin or as additional cost).
 *     - It does **NOT** reduce the amount the seller receives.
 * - Seller net payout = grossAmount - platformFee
 *
 * This model is seller-friendly and keeps referral incentives as a platform growth cost.
 *
 * All UIs and calculations should use these helpers.
 */

export interface PayoutConfig {
  platformCommissionRate: number;   // e.g. 0.12
  referralCommissionRate: number;   // e.g. 0.05
}

export interface PayoutBreakdown {
  grossAmount: number;              // What the buyer actually paid
  platformFee: number;              // Platform's revenue from this order
  referralFee: number;              // Amount owed to the referrer (if any)
  netToSeller: number;              // What should actually be paid to the seller
  referralApplies: boolean;         // Whether this order generated a referral liability
  totalPlatformCost: number;        // platformFee + referralFee (if referral applies)
}

/**
 * Calculates the complete accounting breakdown for one order.
 */
export function calculateOrderPayout(
  price: number,
  sellerWasReferred: boolean,
  config: PayoutConfig = DEFAULT_PAYOUT_CONFIG
): PayoutBreakdown {
  const gross = Math.round(price || 0);
  const platformFee = Math.round(gross * config.platformCommissionRate);

  let referralFee = 0;
  if (sellerWasReferred) {
    referralFee = Math.round(gross * config.referralCommissionRate);
  }

  const netToSeller = gross - platformFee; // Referral fee does not reduce seller payout

  return {
    grossAmount: gross,
    platformFee,
    referralFee,
    netToSeller: Math.max(0, netToSeller),
    referralApplies: sellerWasReferred,
    totalPlatformCost: platformFee + referralFee,
  };
}

/**
 * Aggregates payout breakdown across many orders.
 */
export function aggregatePayouts(breakdowns: PayoutBreakdown[]) {
  return breakdowns.reduce(
    (acc, b) => {
      acc.grossAmount += b.grossAmount;
      acc.platformFee += b.platformFee;
      acc.referralFee += b.referralFee;
      acc.netToSeller += b.netToSeller;
      acc.totalPlatformCost += b.totalPlatformCost;
      return acc;
    },
    {
      grossAmount: 0,
      platformFee: 0,
      referralFee: 0,
      netToSeller: 0,
      totalPlatformCost: 0,
    }
  );
}

/**
 * Default rates loaded from PlatformConfig
 */
export const DEFAULT_PAYOUT_CONFIG: PayoutConfig = {
  platformCommissionRate: 0.12,
  referralCommissionRate: 0.05,
};

/**
 * Gets the effective referral commission rate for a specific referrer.
 * Uses the user's customReferralRate if set, otherwise falls back to the global rate.
 */
export async function getEffectiveReferralRate(referrerId: string): Promise<number> {
  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { customReferralRate: true }
  });

  if (user?.customReferralRate != null) {
    return user.customReferralRate;
  }

  // Fallback to global config
  const config = await prisma.platformConfig.findFirst();
  return config?.referralCommissionRate ?? 0.05;
}
