import type { Metadata } from 'next'
import { BRAND_LOGO_PATH, BRAND_NAME } from '@/lib/brand'
import { PUBLIC_SITE_URL } from '@/lib/public-site'

export function clipMeta(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

export function publicAbsoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${PUBLIC_SITE_URL}${normalized}`
}

export function buildLocalServiceMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
  index = true,
}: {
  title: string
  description: string
  path: string
  image?: string | null
  keywords?: string[]
  index?: boolean
}): Metadata {
  const canonical = publicAbsoluteUrl(path)
  const desc = clipMeta(description)
  const ogImage = image || BRAND_LOGO_PATH

  return {
    title,
    description: desc,
    keywords,
    alternates: { canonical },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description: desc,
      url: canonical,
      siteName: BRAND_NAME,
      locale: 'es_CO',
      type: 'website',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImage],
    },
  }
}

export function gigServiceJsonLd(gig: {
  id: string
  title: string
  description?: string | null
  price: number
  category?: string | null
  city?: string | null
  image?: string | null
  sellerName?: string | null
}) {
  const url = publicAbsoluteUrl(`/gigs/${gig.id}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: gig.title,
    description: clipMeta(gig.description || gig.title, 240),
    url,
    serviceType: gig.category || 'Servicio local',
    areaServed: gig.city || 'Colombia',
    provider: {
      '@type': 'Person',
      name: gig.sellerName || 'Profesional en OigaGIG',
    },
    image: gig.image || undefined,
    offers: {
      '@type': 'Offer',
      price: gig.price,
      priceCurrency: 'COP',
      availability: 'https://schema.org/InStock',
      url,
    },
  }
}
