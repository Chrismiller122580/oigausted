import { detectListingFieldsContact } from '@/lib/contact-moderation'

export const ADULT_CONTENT_BLOCKED_MESSAGE =
  'Este anuncio no se puede publicar: OigaGIG no permite contenido para adultos. Si cree que es un error, escriba a soporte.'

const ACCENT_RE = /[\u0300-\u036f]/g

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(ACCENT_RE, '')
    .replace(/[\u200b-\u200d]/g, '')
}

function stripSafePhrases(normalized: string): string {
  return normalized
    .replace(/\badultos?\s+mayores?\b/g, ' ')
    .replace(/\btercera\s+edad\b/g, ' ')
    .replace(/\bplan\s+prepago\b/g, ' ')
    .replace(/\bsim\s+prepago\b/g, ' ')
    .replace(/\bminutos\s+prepago\b/g, ' ')
    .replace(/\bpaquete\s+prepago\b/g, ' ')
}

const STRONG_RE =
  /\b(onlyfans|fansly|pornhub|xvideos|xnxx|chaturbate|nopor|pornografia|pornografico|porno|\bporn\b|nsfw|escorts?|scorts?|prostitut[ao]s?|proxeneta|striptease|stripper|sugarbab(?:y|ies)|sugar\s*dadd(?:y|ies)|contenido\s+plus\s*18|plus18|\+18|nudes?|pack\s+hot|pack\s+xxx|video\s+hot|fotos?\s+hot|llamada\s+hot|videollamada\s+hot|encuentro\s+sexual|servicio\s+sexual|servicios\s+sexuales|relaciones\s+sexuales|sexo\s+oral|sexo\s+anal|sexo\s+virtual|cybersexo|cibersexo|happy\s+ending|final\s+feliz\s+erotico|masaje\s+erotico|masaje\s+sensual|masaje\s+tantrico|juguetes?\s+sexual(?:es)?|dildo|vibrador)\b/i

const COMBO_A =
  /\b(sexo|sexual|erotic[oa]s?|xxx|hot|caliente|sensual|desnud[oa]s?)\b/i
const COMBO_B =
  /\b(servicio|servicios|encuentro|encuentros|videollamada|video\s*llamada|pack|packs|contenido|fotos?|videos?|masaje|masajes|compania|compania|acompanante|acompanamiento|prepago|prepagos)\b/i

export type AdultDetection = {
  flagged: boolean
  matches: string[]
}

export function detectAdultContent(text: unknown): AdultDetection {
  if (typeof text !== 'string' || !text.trim()) return { flagged: false, matches: [] }
  const normalized = stripSafePhrases(normalize(text))
  const matches: string[] = []

  const strong = normalized.match(STRONG_RE)
  if (strong) matches.push(strong[0].trim())

  if (COMBO_A.test(normalized) && COMBO_B.test(normalized)) {
    const a = normalized.match(COMBO_A)
    const b = normalized.match(COMBO_B)
    if (a) matches.push(a[0].trim())
    if (b) matches.push(b[0].trim())
  }

  const unique = [...new Set(matches.filter(Boolean))]
  return { flagged: unique.length > 0, matches: unique }
}

export function detectAdultFields(values: unknown[]): AdultDetection {
  const matches = new Set<string>()
  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      const hit = detectAdultContent(value)
      hit.matches.forEach((m) => matches.add(m))
      return
    }
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    if (value && typeof value === 'object') {
      Object.values(value as Record<string, unknown>).forEach(walk)
    }
  }
  values.forEach(walk)
  return { flagged: matches.size > 0, matches: [...matches] }
}

export function listingAdultRejection(input: {
  title?: unknown
  description?: unknown
  fields?: unknown
  addons?: unknown
}): { error: string } | null {
  const texts = [input.title, input.description].filter((v): v is string => typeof v === 'string')
  const textHit = texts.map(detectAdultContent).find((r) => r.flagged)
  const fieldHit = detectAdultFields([input.fields, input.addons])
  if (textHit || fieldHit.flagged) {
    return { error: ADULT_CONTENT_BLOCKED_MESSAGE }
  }
  return null
}

/** Keep TypeScript happy if a caller still imports the contact helper from this file. */
export function listingHasContactShape(values: unknown[]) {
  return detectListingFieldsContact(values)
}
