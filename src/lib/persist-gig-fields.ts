import { isQuantityField } from '@/lib/order-price'
import type { CheckoutFormData, DynamicFieldDef } from '@/types/gig-fields'

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
