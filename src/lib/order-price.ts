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

const UNIT_KEY_RE =
  /^(quantity|qty|units?|unidades|cantidad|devices?|equipos?|piezas?)$/i
const UNIT_LABEL_RE =
  /\b(cantidad(?:\s+de\s+[\wáéíóúñ]+)?|n[uú]mero de equipos|n[u\u00famero de unidades|unidades|units?|equipos|piezas)\b/i

/** Buyer-chosen unit count. Seller base price is always for 1 unit. */
export function isQuantityField(field: { key?: string; label?: string } | null | undefined): boolean {
  const key = String(field?.key || '').trim()
  const label = String(field?.label || '').trim()
  if (UNIT_KEY_RE.test(key)) return true
  if (UNIT_LABEL_RE.test(label)) return true
  return false
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
  const fallbackKey = Object.keys(selections).find((key) => isQuantityField({ key }))
  if (fallbackKey) {
    const n = Math.floor(toNum(selections[fallbackKey]))
    return Math.max(1, n || 1)
  }
  return 1
}

/** Server-side order total: base price × units + add-on extras. */
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
