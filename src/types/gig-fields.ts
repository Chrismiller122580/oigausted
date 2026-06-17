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

export interface GigAddonOption {
  name: string
  extraPrice?: number
}

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