import { computeOrderPrice } from '@/lib/order-price'
import type { ColombianDocumentTemplate } from '@/lib/colombian-documents'
import type { DynamicFieldDef } from '@/types/gig-fields'

export function computeDocumentPrice(
  basePriceCOP: number,
  template: ColombianDocumentTemplate,
  customFields: Record<string, unknown>,
): number {
  const fields = template.fields as DynamicFieldDef[]
  return Math.round(computeOrderPrice(basePriceCOP, fields, customFields))
}