import { matchCityInText, normalizeCityName } from '@/lib/colombia-cities'

const STREET_RE =
  /\b(carrera|cra\.?|kr\.?|calle|cll\.?|cl\.?|avenida|av\.?|transversal|tv\.?|diagonal|dg\.?|manzana|mz\.?|apartamento|apto\.?|conjunto|barrio|vereda|#|n[oº°]|kil[oó]metro|km)\b/i
const COORD_RE = /-?\d{1,3}\.\d{3,}/

export function looksLikeStreetAddress(value: string): boolean {
  const text = (value || '').trim()
  if (!text) return false
  if (COORD_RE.test(text)) return true
  if (STREET_RE.test(text)) return true
  if (/\d/.test(text) && /[#,]|n[oº°]/i.test(text)) return true
  return false
}

/** City name only. Drops streets, building numbers, and GPS strings. */
export function toPublicCityName(raw?: string | null): string | null {
  const text = String(raw || '').trim()
  if (!text) return null
  if (/remoto|online/i.test(text)) return 'Remoto / online'

  const known = matchCityInText(text) || normalizeCityName(text)
  if (known) return known.label

  if (looksLikeStreetAddress(text)) return null

  const firstChunk = text.split(/[\n,|]/)[0]?.trim() || ''
  if (!firstChunk || looksLikeStreetAddress(firstChunk) || /\d/.test(firstChunk)) return null
  if (firstChunk.length > 40) return null
  return firstChunk
}

export function formatPublicCityCountry(
  raw?: string | null,
  isRemote?: boolean | null
): string | null {
  const city = toPublicCityName(raw)
  if (city === 'Remoto / online') return city
  if (city) {
    if (/,\s*colombia$/i.test(city)) return city
    return `${city}, Colombia`
  }
  if (isRemote) return 'Remoto / online'
  if (String(raw || '').trim()) return 'Colombia'
  return null
}

export function publicMapCoords(rawCity?: string | null): {
  latitude: number | null
  longitude: number | null
} {
  const text = String(rawCity || '').trim()
  const known = text ? matchCityInText(text) || normalizeCityName(text) : null
  if (known?.lat != null && known.lng != null) {
    return { latitude: known.lat, longitude: known.lng }
  }
  return { latitude: null, longitude: null }
}

/** Persist only a city label. Never store a street on public location fields. */
export function sanitizeStoredCity(raw?: string | null): string | null {
  return toPublicCityName(raw)
}
