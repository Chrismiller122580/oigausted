import { isQuantityField } from '@/lib/order-price'
import type { CheckoutFormData, DynamicFieldDef } from '@/types/gig-fields'

/** Listing facts only the seller can know. Buyer must not pick these at checkout. */
const SELLER_ATTRIBUTE_KEYS = new Set([
  'producttype',
  'origin',
  'origen',
  'condition',
  'condicion',
  'condición',
  'vehicletype',
  'resourcetype',
  'year',
  'año',
  'anio',
  'unit',
  'unidad',
])

const SELLER_ATTRIBUTE_LABEL =
  /tipo de producto|origen|condici[oó]n|tipo de veh[ií]culo|tipo de recurso|a[nñ]o del modelo|unidad de medida/i

export function isSellerAttributeField(
  field: Pick<DynamicFieldDef, 'key' | 'label' | 'owner' | 'type'> | null | undefined
): boolean {
  if (!field) return false
  if (field.owner === 'seller') return true
  if (field.owner === 'buyer') return false
  const key = String(field.key || '').toLowerCase().replace(/[\s_-]+/g, '')
  if (SELLER_ATTRIBUTE_KEYS.has(key)) return true
  return SELLER_ATTRIBUTE_LABEL.test(String(field.label || ''))
}

export function seedQuantityDefaults(
  fields: DynamicFieldDef[],
  prev: CheckoutFormData = {}
): CheckoutFormData {
  const next: CheckoutFormData = { ...prev }
  for (const field of fields) {
    const current = next[field.key]
    if (isQuantityField(field) && (current === undefined || current === '' || current === 0)) {
      next[field.key] = 1
    }
  }
  return next
}

export function restoreGigFieldValues(fields: DynamicFieldDef[]): CheckoutFormData {
  const restored: CheckoutFormData = {}
  for (const field of fields) {
    if (field.value !== undefined && field.value !== null && field.value !== '') {
      restored[field.key] = field.value as string | number | boolean
    } else if (isQuantityField(field)) {
      restored[field.key] = 1
    }
  }
  return restored
}

export function fieldsWithPersistedValues(
  fields: DynamicFieldDef[],
  formData: CheckoutFormData
): DynamicFieldDef[] {
  return fields.map((field) => {
    const raw = formData[field.key]
    const value =
      raw !== undefined && raw !== ''
        ? raw
        : isQuantityField(field)
          ? 1
          : field.value
    return { ...field, value }
  })
}
