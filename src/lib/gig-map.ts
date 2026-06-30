import { colombianCities, COLOMBIA_MAP_CENTER } from '@/lib/design-tokens'

export type GigMapSource = {
  id: string
  title: string
  price: number
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  isRemote?: boolean | null
  seller?: {
    city?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null
}

export type GigMapPin = {
  id: string
  title: string
  price: number
  city: string
  lat: number
  lng: number
}

export type CityCluster = {
  city: string
  lat: number
  lng: number
  count: number
  pins: GigMapPin[]
}

export { COLOMBIA_MAP_CENTER }

function normalizeCity(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function hashCityCoords(city: string): { lat: number; lng: number } {
  let hash = 0
  for (let i = 0; i < city.length; i++) {
    hash = (hash + city.charCodeAt(i) * (i + 1)) % 1000
  }
  const angle = (hash / 1000) * 2 * Math.PI
  const radius = 0.6 + (hash % 80) / 100
  return {
    lat: COLOMBIA_MAP_CENTER.lat + Math.cos(angle) * radius,
    lng: COLOMBIA_MAP_CENTER.lng + Math.sin(angle) * radius,
  }
}

function lookupCityCoords(city: string | null | undefined): { lat: number; lng: number } | null {
  if (!city?.trim()) return null
  const normalized = normalizeCity(city)
  const exact = colombianCities.find(
    (c) => normalizeCity(c.label) === normalized || normalizeCity(c.slug) === normalized,
  )
  if (exact) return { lat: exact.lat, lng: exact.lng }

  const partial = colombianCities.find(
    (c) =>
      normalized.includes(normalizeCity(c.label)) ||
      normalizeCity(c.label).includes(normalized),
  )
  if (partial) return { lat: partial.lat, lng: partial.lng }

  return hashCityCoords(city.trim())
}

function resolveCoords(
  lat?: number | null,
  lng?: number | null,
): { lat: number; lng: number } | null {
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng }
  }
  return null
}

export function resolveGigPin(gig: GigMapSource): GigMapPin | null {
  const city = gig.city?.trim() || gig.seller?.city?.trim() || ''

  const gigCoords = resolveCoords(gig.latitude, gig.longitude)
  if (gigCoords) {
    return {
      id: gig.id,
      title: gig.title,
      price: gig.price,
      city: city || 'Colombia',
      lat: gigCoords.lat,
      lng: gigCoords.lng,
    }
  }

  const sellerCoords = resolveCoords(gig.seller?.latitude, gig.seller?.longitude)
  if (sellerCoords) {
    return {
      id: gig.id,
      title: gig.title,
      price: gig.price,
      city: city || 'Colombia',
      lat: sellerCoords.lat,
      lng: sellerCoords.lng,
    }
  }

  const cityCoords = lookupCityCoords(city)
  if (!cityCoords) return null

  return {
    id: gig.id,
    title: gig.title,
    price: gig.price,
    city,
    lat: cityCoords.lat,
    lng: cityCoords.lng,
  }
}

export function buildGigMapPins(gigs: GigMapSource[]): GigMapPin[] {
  return gigs.map(resolveGigPin).filter((pin): pin is GigMapPin => pin !== null)
}

/** Spread overlapping pins in the same city so each stays individually clickable. */
export function jitterPinsInCity(pins: GigMapPin[]): GigMapPin[] {
  const byCity = new Map<string, GigMapPin[]>()

  for (const pin of pins) {
    const key = normalizeCity(pin.city)
    const group = byCity.get(key) ?? []
    group.push(pin)
    byCity.set(key, group)
  }

  const jittered: GigMapPin[] = []

  for (const group of byCity.values()) {
    if (group.length === 1) {
      jittered.push(group[0])
      continue
    }

    const radius = 0.012
    group.forEach((pin, index) => {
      const angle = (2 * Math.PI * index) / group.length
      jittered.push({
        ...pin,
        lat: pin.lat + Math.cos(angle) * radius,
        lng: pin.lng + Math.sin(angle) * radius,
      })
    })
  }

  return jittered
}

export function groupGigsByCity(pins: GigMapPin[]): CityCluster[] {
  const map = new Map<string, CityCluster>()

  for (const pin of pins) {
    const key = normalizeCity(pin.city)
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
      existing.pins.push(pin)
      continue
    }

    const coords = lookupCityCoords(pin.city) ?? { lat: pin.lat, lng: pin.lng }
    map.set(key, {
      city: pin.city,
      lat: coords.lat,
      lng: coords.lng,
      count: 1,
      pins: [pin],
    })
  }

  return [...map.values()].sort((a, b) => b.count - a.count)
}