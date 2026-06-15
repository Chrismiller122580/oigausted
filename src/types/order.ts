import type { OrderStatusLabelValue } from '@/lib/order-status'
import type { JsonValue } from '@/types/json'
import type { GigCheckoutShape } from '@/types/gig-fields'

export interface OrderUserSummary {
  id: string
  name: string | null
  email?: string | null
  businessName?: string | null
}

export interface OrderDetail {
  id: string
  price: number
  status: OrderStatusLabelValue
  progress?: number | null
  trackingNumber?: string | null
  createdAt: string
  updatedAt: string
  buyerId: string
  sellerId: string
  gigId: string
  customFields?: JsonValue
  serviceLatitude?: number | null
  serviceLongitude?: number | null
  serviceAddress?: string | null
  gig?: GigCheckoutShape & { title?: string; description?: string }
  buyer?: OrderUserSummary
  seller?: OrderUserSummary
}

export interface OrderMessage {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender?: OrderUserSummary
  attachmentUrl?: string | null
  attachmentName?: string | null
  /** Present on chat messages from the orders API */
  isFromBuyer?: boolean
  fileUrl?: string | null
}

export interface OrderReview {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  buyerId?: string
  reviewer?: OrderUserSummary
  order?: { gig?: { title?: string } }
}

export type OrderTab = 'overview' | 'chat' | 'progress' | 'review'