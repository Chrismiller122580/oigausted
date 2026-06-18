export type NetworkGigSeller = {
  id: string
  name?: string | null
  businessName?: string | null
  slug?: string | null
  profilePicture?: string | null
  rating?: number | null
  reviewCount?: number | null
  city?: string | null
  whatsapp?: string | null
  latitude?: number | null
  longitude?: number | null
  serviceRadiusKm?: number | null
}

export type NetworkGig = {
  id: string
  title: string
  description?: string | null
  price: number
  category?: string | null
  imageUrl?: string | null
  isActive?: boolean
  isRemote?: boolean | null
  latitude?: number | null
  longitude?: number | null
  createdAt?: string
  seller?: NetworkGigSeller | null
}

export type ProjectBundleItem = {
  gigId: string
  title: string
  price: number
  category?: string | null
  sellerId: string
  sellerName: string
  sellerSlug?: string | null
  sellerWhatsapp?: string | null
}

export type ProjectBundle = {
  items: ProjectBundleItem[]
  updatedAt: string
}

export function projectBundleStorageKey(userId: string): string {
  return `seller_project_bundle_${userId}`
}

export function loadProjectBundle(userId: string): ProjectBundle {
  if (typeof window === 'undefined') {
    return { items: [], updatedAt: new Date().toISOString() }
  }
  try {
    const raw = localStorage.getItem(projectBundleStorageKey(userId))
    if (!raw) return { items: [], updatedAt: new Date().toISOString() }
    const parsed = JSON.parse(raw) as ProjectBundle
    if (!parsed || !Array.isArray(parsed.items)) {
      return { items: [], updatedAt: new Date().toISOString() }
    }
    return parsed
  } catch {
    return { items: [], updatedAt: new Date().toISOString() }
  }
}

export function saveProjectBundle(userId: string, bundle: ProjectBundle): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    projectBundleStorageKey(userId),
    JSON.stringify({ ...bundle, updatedAt: new Date().toISOString() })
  )
}

export function clearProjectBundle(userId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(projectBundleStorageKey(userId))
}

export function sellerDisplayName(seller: NetworkGigSeller | null | undefined): string {
  return seller?.businessName || seller?.name || 'Vendedor'
}

export function sellerPublicPath(seller: NetworkGigSeller | null | undefined): string {
  return `/sellers/${seller?.slug || seller?.id || ''}`
}

export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function networkGigToBundleItem(gig: NetworkGig): ProjectBundleItem {
  const seller = gig.seller
  return {
    gigId: gig.id,
    title: gig.title,
    price: gig.price,
    category: gig.category ?? null,
    sellerId: seller?.id || '',
    sellerName: sellerDisplayName(seller),
    sellerSlug: seller?.slug ?? null,
    sellerWhatsapp: seller?.whatsapp ?? null,
  }
}

export function formatProjectQuote(items: ProjectBundleItem[]): string {
  if (items.length === 0) {
    return 'Proyecto combinado — OigaGig\n(No hay servicios seleccionados)'
  }

  const lines = items.map(
    (item) => `• ${item.title} — $${item.price.toLocaleString('es-CO')} (${item.sellerName})`
  )
  const total = items.reduce((sum, item) => sum + item.price, 0)

  return [
    'Proyecto combinado — OigaGig',
    '─────────────────────────',
    ...lines,
    '─────────────────────────',
    `Total estimado: $${total.toLocaleString('es-CO')}`,
    'Contacta a cada vendedor para coordinar el proyecto.',
  ].join('\n')
}

export function groupBundleBySeller(
  items: ProjectBundleItem[]
): Map<string, { sellerName: string; sellerSlug?: string | null; sellerWhatsapp?: string | null; items: ProjectBundleItem[] }> {
  const map = new Map<
    string,
    { sellerName: string; sellerSlug?: string | null; sellerWhatsapp?: string | null; items: ProjectBundleItem[] }
  >()

  for (const item of items) {
    const key = item.sellerId || item.sellerName
    const existing = map.get(key)
    if (existing) {
      existing.items.push(item)
    } else {
      map.set(key, {
        sellerName: item.sellerName,
        sellerSlug: item.sellerSlug,
        sellerWhatsapp: item.sellerWhatsapp,
        items: [item],
      })
    }
  }

  return map
}

export function bundleTotal(items: ProjectBundleItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}