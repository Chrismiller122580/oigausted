export type ContactViolationType =
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'instagram'
  | 'social_link'
  | 'handle'

export type ContactDetectionResult = {
  blocked: boolean
  types: ContactViolationType[]
}

export const CONTACT_BLOCKED_MESSAGE =
  'No compartas teléfonos, correos o redes sociales. Usa el chat de OigaGIG para coordinar.'

export const LISTING_CONTACT_BLOCKED_MESSAGE =
  'No publique teléfonos, WhatsApp, correos ni redes sociales en el gig. El comprador debe contactarlo por el chat de OigaGIG.'

const EMAIL_RE =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i

const OBFUSCATED_EMAIL_RE =
  /\b[a-z0-9._%+-]+\s*(?:@|arroba|\(at\)|\[at\])\s*[a-z0-9.-]+\s*(?:\.|punto|\(dot\)|\[dot\])\s*[a-z]{2,}\b/i

const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4,}/

const COLOMBIAN_MOBILE_RE = /\b3\d{9}\b/

const LISTING_MOBILE_RE =
  /(?<!\d)(?:\+?57[\s.\-]*)?3(?:[\s.\-]?\d){9}(?!\d)/g

const WHATSAPP_RE =
  /\b(?:whatsapp|whats\s?app|wsp|wasap|wassap|wa\.me|api\.whatsapp)\b/i

const WA_LINK_RE =
  /https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s)]+/gi

const INSTAGRAM_RE =
  /\b(?:instagram\.com|instagr\.am|ig:|ver en instagram)\b/i

const SOCIAL_DOMAIN_RE =
  /\b(?:facebook\.com|fb\.com|tiktok\.com|telegram\.me|t\.me|linkedin\.com)\b/i

const HANDLE_RE =
  /(?:^|\s)@[a-z0-9._]{3,}\b/i

const OBFUSCATION_HINTS =
  /\b(?:gmail|hotmail|outlook|yahoo|correo|escr[ií]beme|escribeme|ll[aá]mame|llamame|escribe al|mi n[uú]mero|mi numero|mi celular|mi telefono|mi tel[eé]fono)\b/i

const CONTACT_CHANNEL_RE =
  /\b(?:cont(?:a|á)ct(?:e|ame|enos)?|escr[ií]b(?:e|eme|anos)|ll[aá]m(?:e|ame|anos)|info(?:rmaci[oó]n)?|comunicarse|v[ií]a|por)\s+(?:whats?\s?app|wsp|wasap|wassap)\b/gi

function normalizeForScan(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function resetRegex(re: RegExp) {
  re.lastIndex = 0
  return re
}

/** Detect phone/email/social contact info in chat messages. */
export function detectContactInfo(text: string): ContactDetectionResult {
  const trimmed = text?.trim()
  if (!trimmed) return { blocked: false, types: [] }

  const types = new Set<ContactViolationType>()
  const normalized = normalizeForScan(trimmed)

  if (EMAIL_RE.test(trimmed) || OBFUSCATED_EMAIL_RE.test(normalized)) {
    types.add('email')
  }

  if (PHONE_RE.test(trimmed) || COLOMBIAN_MOBILE_RE.test(trimmed.replace(/\D/g, ' '))) {
    const digitsOnly = trimmed.replace(/\D/g, '')
    const isPriceLike =
      /\$\s*[\d.,]+/.test(trimmed) &&
      digitsOnly.length <= 9 &&
      !COLOMBIAN_MOBILE_RE.test(digitsOnly)
    if (!isPriceLike) types.add('phone')
  }

  if (WHATSAPP_RE.test(normalized)) types.add('whatsapp')
  if (INSTAGRAM_RE.test(normalized)) types.add('instagram')
  if (SOCIAL_DOMAIN_RE.test(normalized)) types.add('social_link')
  if (HANDLE_RE.test(trimmed)) types.add('handle')

  if (types.size === 0 && OBFUSCATION_HINTS.test(normalized) && PHONE_RE.test(trimmed)) {
    types.add('phone')
  }

  return {
    blocked: types.size > 0,
    types: [...types],
  }
}

/** Stricter scan for public listing copy (avoids UUID / blob URL false positives). */
export function detectListingContactInfo(text: string): ContactDetectionResult {
  const trimmed = text?.trim()
  if (!trimmed) return { blocked: false, types: [] }

  const types = new Set<ContactViolationType>()
  const normalized = normalizeForScan(trimmed)

  if (resetRegex(EMAIL_RE).test(trimmed) || resetRegex(OBFUSCATED_EMAIL_RE).test(normalized)) {
    types.add('email')
  }
  if (resetRegex(LISTING_MOBILE_RE).test(trimmed)) {
    types.add('phone')
  }
  if (resetRegex(WA_LINK_RE).test(trimmed) || resetRegex(CONTACT_CHANNEL_RE).test(normalized) || /\b(?:wa\.me|api\.whatsapp)\b/i.test(normalized)) {
    types.add('whatsapp')
  }
  if (resetRegex(INSTAGRAM_RE).test(normalized)) types.add('instagram')
  if (resetRegex(SOCIAL_DOMAIN_RE).test(normalized)) types.add('social_link')
  if (resetRegex(HANDLE_RE).test(trimmed)) types.add('handle')

  return {
    blocked: types.size > 0,
    types: [...types],
  }
}

export function detectListingFieldsContact(values: unknown[]): ContactDetectionResult {
  const types = new Set<ContactViolationType>()
  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      for (const t of detectListingContactInfo(value).types) types.add(t)
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
  return { blocked: types.size > 0, types: [...types] }
}

export function scrubListingText(text: string | null | undefined): string | null {
  if (text == null) return text ?? null
  if (!text) return text

  let out = text
  out = out.replace(resetRegex(EMAIL_RE), '[correo oculto]')
  out = out.replace(resetRegex(OBFUSCATED_EMAIL_RE), '[correo oculto]')
  out = out.replace(resetRegex(WA_LINK_RE), '[enlace oculto]')
  out = out.replace(resetRegex(LISTING_MOBILE_RE), '[número oculto]')
  out = out.replace(resetRegex(CONTACT_CHANNEL_RE), 'chat de OigaGIG')
  out = out.replace(resetRegex(SOCIAL_DOMAIN_RE), '[red social oculta]')
  out = out.replace(/\binstagram\.com\/[^\s)]+/gi, '[red social oculta]')
  out = out.replace(/(^|\s)@[a-z0-9._]{3,}\b/gi, '$1[usuario oculto]')
  out = out.replace(/\(\s*instagram\s*\)/gi, '')
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

export function scrubListingValue<T>(value: T): T {
  if (typeof value === 'string') return scrubListingText(value) as T
  if (Array.isArray(value)) return value.map((item) => scrubListingValue(item)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = scrubListingValue(nested)
    }
    return out as T
  }
  return value
}

export function listingTextChanged(before: string | null | undefined, after: string | null | undefined) {
  return (before || '') !== (after || '')
}

export function redactSnippet(text: string, maxLen = 80): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLen) return compact
  return `${compact.slice(0, maxLen)}…`
}
