/**
 * Sellers must not use their email address as a business name.
 * This blocks the common pattern of putting an email in the businessName field,
 * which would otherwise leak contact info on public profiles.
 */

const EMAIL_AS_BUSINESS_NAME_RE =
  /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$/i

export const EMAIL_AS_BUSINESS_NAME_ERROR =
  'No puedes usar tu correo electrónico como nombre de negocio. Elige un nombre comercial distinto.'

/** True when the candidate looks like an email address. */
export function isEmailAddress(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return EMAIL_AS_BUSINESS_NAME_RE.test(trimmed)
}

/**
 * Returns an error message when `businessName` is an email, otherwise null.
 * Pass the seller's own email to also catch the exact match case.
 */
export function isEmailAsBusinessName(
  businessName: string | null | undefined,
  sellerEmail?: string | null,
): string | null {
  const name = (businessName || '').trim()
  if (!name) return null
  if (isEmailAddress(name)) return EMAIL_AS_BUSINESS_NAME_ERROR
  const email = (sellerEmail || '').trim().toLowerCase()
  if (email && name.toLowerCase() === email) return EMAIL_AS_BUSINESS_NAME_ERROR
  return null
}
