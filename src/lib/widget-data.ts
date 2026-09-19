import type { UserRole, StaffRole } from '@/lib/session'

export type WidgetRole = UserRole | 'guest'

export type WidgetAction = {
  label: string
  href: string
}

export type WidgetItem = {
  title: string
  subtitle?: string
  href: string
  badge?: string
}

export type WidgetPayload = {
  role: WidgetRole
  staffRole?: StaffRole | null
  greeting: string
  city?: string | null
  stats: { label: string; value: string; href?: string }[]
  items: WidgetItem[]
  primary: WidgetAction
  secondary: WidgetAction
  updatedAt: string
}

export const WIDGET_DEEP_LINKS = {
  home: 'https://oigagig.com',
  gigs: 'https://oigagig.com/gigs',
  buyer: 'https://oigagig.com/buyer',
  seller: 'https://oigagig.com/seller',
  sellerOrders: 'https://oigagig.com/seller/orders',
  sellerNewGig: 'https://oigagig.com/seller/gigs',
  orders: 'https://oigagig.com/orders',
  messages: 'https://oigagig.com/messages',
  admin: 'https://oigagig.com/admin',
  signupBuyer: 'https://oigagig.com/signup?role=buyer',
  signupSeller: 'https://oigagig.com/signup?role=seller',
  login: 'https://oigagig.com/login',
} as const

export function guestWidget(): WidgetPayload {
  return {
    role: 'guest',
    greeting: 'OigaGIG',
    stats: [
      { label: 'Cobertura', value: 'Colombia' },
      { label: 'Pago', value: 'Wompi' },
    ],
    items: [
      { title: 'Buscar un servicio', subtitle: 'Plomero, limpieza, diseño…', href: WIDGET_DEEP_LINKS.gigs },
      { title: 'Ofrecer lo que usted hace', subtitle: 'Publicar un gig es gratis', href: WIDGET_DEEP_LINKS.signupSeller },
    ],
    primary: { label: 'Necesito un servicio', href: WIDGET_DEEP_LINKS.signupBuyer },
    secondary: { label: 'Soy profesional', href: WIDGET_DEEP_LINKS.signupSeller },
    updatedAt: new Date().toISOString(),
  }
}
