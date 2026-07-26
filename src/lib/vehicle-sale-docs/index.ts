import { parseJsonArrayField } from '@/lib/utils'
import {
  SALE_DOCS_ADDON_KIND,
  SALE_DOCS_ADDON_NAME,
  SALE_DOCS_CHECKOUT_KEY,
  SALE_DOCS_CITY_KEY,
  type GigAddonOption,
} from '@/types/gig-fields'
import { getCityDocProfile } from './city-doc-profiles'
import { buildPapersChecklistHtml, buildSaleContractHtml } from './templates'
import type { VehicleSaleDocContext, VehicleSaleDocKind } from './types'

export * from './types'
export * from './city-doc-profiles'
export { buildSaleContractHtml, buildPapersChecklistHtml }

export function isSaleDocsAddon(opt: GigAddonOption | null | undefined): boolean {
  if (!opt) return false
  if (opt.kind === SALE_DOCS_ADDON_KIND) return true
  const n = (opt.name || '').toLowerCase()
  return n.includes('paquete documentos oigagig') || n.includes('documentos oigagig')
}

export function findSaleDocsAddon(addons: unknown): GigAddonOption | null {
  const list = parseJsonArrayField(addons) as GigAddonOption[]
  return list.find((a) => isSaleDocsAddon(a)) || null
}

export function orderIncludesSaleDocsBundle(customFields: unknown): boolean {
  if (!customFields) return false
  let data: Record<string, unknown> = {}
  if (typeof customFields === 'string') {
    try {
      data = JSON.parse(customFields) as Record<string, unknown>
    } catch {
      return false
    }
  } else if (typeof customFields === 'object' && customFields !== null) {
    data = customFields as Record<string, unknown>
  }
  const v = data[SALE_DOCS_CHECKOUT_KEY]
  return v === true || v === 'true' || v === 1 || v === '1'
}

export function resolveSaleDocsCityId(
  customFields: unknown,
  addon: GigAddonOption | null,
  gigCity?: string | null,
  sellerCity?: string | null,
): string {
  let data: Record<string, unknown> = {}
  if (typeof customFields === 'string') {
    try {
      data = JSON.parse(customFields) as Record<string, unknown>
    } catch {
      data = {}
    }
  } else if (typeof customFields === 'object' && customFields !== null) {
    data = customFields as Record<string, unknown>
  }

  const fromOrder = data[SALE_DOCS_CITY_KEY]
  if (typeof fromOrder === 'string' && fromOrder.trim()) return fromOrder.trim()
  if (addon?.meta?.cityId) return String(addon.meta.cityId)
  if (addon?.meta?.cityLabel) return String(addon.meta.cityLabel)
  if (gigCity?.trim()) return gigCity.trim()
  if (sellerCity?.trim()) return sellerCity.trim()
  return ''
}

export function buildSaleDocsContext(input: {
  orderId: string
  orderPrice: number
  createdAt?: Date | string | null
  customFields?: unknown
  gigTitle?: string | null
  gigCity?: string | null
  sellerName?: string | null
  sellerCity?: string | null
  buyerName?: string | null
  addons?: unknown
  gigFields?: unknown
}): VehicleSaleDocContext {
  const addon = findSaleDocsAddon(input.addons)
  const cityId = resolveSaleDocsCityId(
    input.customFields,
    addon,
    input.gigCity,
    input.sellerCity,
  )
  const city = getCityDocProfile(cityId)

  let cf: Record<string, unknown> = {}
  if (typeof input.customFields === 'string') {
    try {
      cf = JSON.parse(input.customFields) as Record<string, unknown>
    } catch {
      cf = {}
    }
  } else if (input.customFields && typeof input.customFields === 'object') {
    cf = input.customFields as Record<string, unknown>
  }

  const fieldsList = parseJsonArrayField(input.gigFields) as Array<{ key?: string; label?: string }>
  // Prefer checkout selections for known vehicle keys
  const vehicleType =
    (cf.vehicleType as string) ||
    (cf['Tipo de vehículo'] as string) ||
    undefined
  const condition = (cf.condition as string) || undefined
  const year = (cf.year as string | number) || undefined

  const saleDate = input.createdAt
    ? new Date(input.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('es-CO')

  return {
    orderId: input.orderId,
    orderPrice: input.orderPrice || 0,
    saleDate,
    city,
    sellerName: input.sellerName || 'Vendedor',
    buyerName: input.buyerName || 'Comprador',
    gigTitle: input.gigTitle || SALE_DOCS_ADDON_NAME,
    vehicleType: vehicleType || fieldsList.find((f) => f.key === 'vehicleType')?.label,
    condition,
    year,
    plate: typeof cf.plate === 'string' ? cf.plate : undefined,
    brand: typeof cf.brand === 'string' ? cf.brand : undefined,
    model: typeof cf.model === 'string' ? cf.model : undefined,
    color: typeof cf.color === 'string' ? cf.color : undefined,
    vin: typeof cf.vin === 'string' ? cf.vin : undefined,
  }
}

export function renderSaleDoc(kind: VehicleSaleDocKind, ctx: VehicleSaleDocContext): string {
  return kind === 'checklist' ? buildPapersChecklistHtml(ctx) : buildSaleContractHtml(ctx)
}

export function saleDocFilename(kind: VehicleSaleDocKind, orderId: string): string {
  const short = orderId.slice(0, 8)
  return kind === 'checklist'
    ? `checklist-papeles-${short}.html`
    : `contrato-compraventa-${short}.html`
}
