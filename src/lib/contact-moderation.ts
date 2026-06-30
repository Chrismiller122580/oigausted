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
  'No compartas teléfonos, correos o redes sociales. Usa el chat de Oigagig para coordinar.'

const EMAIL_RE =
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i

const OBFUSCATED_EMAIL_RE =
  /\b[a-z0-9._%+-]+\s*(?:@|arroba|\(at\)|\[at\])\s*[a-z0-9.-]+\s*(?:\.|punto|\(dot\)|\[dot\])\s*[a-z]{2,}\b/i

const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4,}/

const COLOMBIAN_MOBILE_RE = /\b3\d{9}\b/

const WHATSAPP_RE =
  /\b(?:whatsapp|wsp|wa\.me|api\.whatsapp)\b/i

const INSTAGRAM_RE =
  /\b(?:instagram\.com|instagr\.am|ig:|ver en instagram)\b/i

const SOCIAL_DOMAIN_RE =
  /\b(?:facebook\.com|fb\.com|tiktok\.com|telegram\.me|t\.me|linkedin\.com)\b/i

const HANDLE_RE =
  /(?:^|\s)@[a-z0-9._]{3,}\b/i

const OBFUSCATION_HINTS =
  /\b(?:gmail|hotmail|outlook|yahoo|correo|escríbeme|escribeme|llámame|llamame|escribe al|mi número|mi numero|mi celular|mi telefono|mi teléfono)\b/i

function normalizeForScan(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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

export function redactSnippet(text: string, maxLen = 80): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLen) return compact
  return `${compact.slice(0, maxLen)}…`
}