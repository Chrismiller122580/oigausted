import { parseJsonArrayField } from '@/lib/utils'

type FieldDef = {
  key: string
  type?: string
  extraPrice?: number
  options?: Array<string | { label: string; extraPrice?: number }>
}

function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

/** Server-side order total from gig base price + dynamic field selections. */
export function computeOrderPrice(
  basePrice: number,
  fields: unknown,
  customFields: Record<string, unknown> | null | undefined
): number {
  const fieldDefs = parseJsonArrayField(fields) as FieldDef[]
  const selections = customFields ?? {}

  let extra = 0
  for (const field of fieldDefs) {
    const value = selections[field.key]
    if (value == null || value === '' || value === false) continue

    if (field.type === 'number' && typeof value === 'number') {
      extra += value * toNum(field.extraPrice)
    } else if (field.type === 'checkbox' && value === true) {
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

  return Math.max(0, toNum(basePrice) + extra)
}