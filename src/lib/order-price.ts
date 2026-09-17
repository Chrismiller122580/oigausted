import { parseJsonArrayField } from '@/lib/utils'

type FieldDef = {
  key: string
  label?: string
  type?: string
  extraPrice?: number
  options?: Array<string | { label: string; extraPrice?: number }>
}

function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

export function isQuantityField(field: { key?: string; label?: string } | null | undefined): boolean {
  const text = `${field?.key || ''} ${field?.label || ''}`.toLowerCase()
  return /quantity|qty|unidades|units|cantidad/.test(text)
}

export function quantityFromSelections(
  fields: unknown,
  customFields: Record<string, unknown> | null | undefined
): number {
  const fieldDefs = parseJsonArrayField(fields) as FieldDef[]
  const selections = customFields ?? {}
  for (const field of fieldDefs) {
    if (!isQuantityField(field)) continue
    const n = Math.floor(toNum(selections[field.key]))
    return Math.max(1, n || 1)
  }
  return 1
}

/** Server-side order total from gig base price + dynamic field selections. */
export function computeOrderPrice(
  basePrice: number,
  fields: unknown,
  customFields: Record<string, unknown> | null | undefined
): number {
  const fieldDefs = parseJsonArrayField(fields) as FieldDef[]
  const selections = customFields ?? {}
  const qty = quantityFromSelections(fieldDefs, selections)

  let extra = 0
  for (const field of fieldDefs) {
    if (isQuantityField(field)) continue
    const value = selections[field.key]
    if (value == null || value === '' || value === false) continue

    if (field.type === 'number') {
      extra += toNum(value) * toNum(field.extraPrice)
    } else if (field.type === 'checkbox' && (value === true || value === 'true')) {
      extra += toNum(field.extraPrice)
    } else if (field.type === 'select' && field.options) {
      const chosen = field.options.find((o) =>
        typeof o === 'string' ? o === value : o.label === value
      )
      if (chosen && typeof chosen === 'object' && chosen.extraPrice != null) {
        extra += toNum(chosen.extraPrice)
      }
    }
  }

  return Math.max(0, toNum(basePrice) * qty + extra)
}
