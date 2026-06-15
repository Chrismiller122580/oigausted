import type { OrderDetail } from '@/types/order'
import type { PayoutBreakdown } from '@/lib/payout'

export interface PayoutSellerSummary {
  referredById?: string | null
  payoutAccountNumber?: string | null
  payoutBankCode?: string | null
  businessName?: string | null
  name?: string | null
}

export interface PayoutOrder extends Omit<OrderDetail, 'seller'> {
  sellerPayoutAt?: string | null
  wompiPayoutRef?: string | null
  reference?: string
  breakdown?: PayoutBreakdown
  seller?: PayoutSellerSummary
}

export interface ReferralPayoutSummary {
  referrer: { id: string; name: string | null; email: string }
  pendingPayout?: number
  totalGenerated?: number
  referredCount?: number
}