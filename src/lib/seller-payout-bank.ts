export const REQUIRED_SELLER_PAYOUT_BANK_FIELDS = [
  'payoutBankCode',
  'payoutAccountNumber',
  'payoutHolderName',
  'payoutDocumentNumber',
] as const

export type SellerPayoutBankField = (typeof REQUIRED_SELLER_PAYOUT_BANK_FIELDS)[number]

export type SellerPayoutBankFields = Partial<Record<SellerPayoutBankField, string | null | undefined>>

export function missingSellerPayoutBankFields(seller: SellerPayoutBankFields): SellerPayoutBankField[] {
  return REQUIRED_SELLER_PAYOUT_BANK_FIELDS.filter((field) => !seller[field]?.trim())
}

export function sellerPayoutBankIsComplete(seller: SellerPayoutBankFields): boolean {
  return missingSellerPayoutBankFields(seller).length === 0
}
