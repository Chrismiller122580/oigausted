import type { JsonValue } from '@/types/json'

export type DynamicFieldType = 'number' | 'checkbox' | 'select' | 'text' | string

export interface DynamicFieldDef {
  key: string
  label: string
  type: DynamicFieldType
  extraPrice?: number
  options?: DynamicFieldOption[]
  required?: boolean
}

export interface GigAddonMeta {
  cityId?: string
  cityLabel?: string
  [key: string]: string | number | boolean | undefined
}

export interface GigAddonOption {
  name: string
  extraPrice?: number
  /** Structured addon kinds (e.g. oigagig_sale_docs for vehicle document pack). */
  kind?: string
  meta?: GigAddonMeta
}

/** Kind constant for the OigaGIG vehicle sale document bundle. */
export const SALE_DOCS_ADDON_KIND = 'oigagig_sale_docs' as const
export const SALE_DOCS_ADDON_NAME = 'Paquete documentos OigaGIG' as const
export const SALE_DOCS_DEFAULT_PRICE = 89000
export const SALE_DOCS_CHECKOUT_KEY = 'addon_oigagig_sale_docs' as const
export const SALE_DOCS_CITY_KEY = 'sale_docs_city' as const

export interface GigCategoryTemplate {
  name: string
  fields?: DynamicFieldDef[]
}

/** Minimal gig shape for checkout / dynamic field components */
export interface GigCheckoutShape {
  id: string
  title: string
  category: string
  basePrice: number
  fields?: JsonValue
  addons?: JsonValue
  isRemote?: boolean
  sellerId?: string
  imageUrl?: string | null
  images?: string[]
  city?: string | null
}

export type CheckoutFormData = Record<string, string | number | boolean>

/** Gig shape returned by GET /api/gigs/[id] for checkout */
export interface CheckoutGig extends GigCheckoutShape {
  price?: number
  seller?: {
    id?: string
    businessName?: string | null
    name?: string | null
    serviceRadiusKm?: number | null
  }
}

export type DynamicFieldOption =
  | string
  | { label: string; extraPrice?: number }