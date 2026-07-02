export type PrintShopInput = {
  printShopEmail?: string | null
  printShopName?: string | null
  printShopPhone?: string | null
}

export type PrintShopDetails = {
  printShopEmail: string
  printShopName: string | null
  printShopPhone: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizePrintShopEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  return trimmed || null
}

export function normalizePrintShopName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

export function normalizePrintShopPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

export function isValidPrintShopEmail(email: string): boolean {
  return EMAIL_RE.test(email)
}

export function parsePrintShopInput(body: PrintShopInput): PrintShopDetails | { error: string } {
  const printShopEmail = normalizePrintShopEmail(body.printShopEmail)
  if (!printShopEmail) {
    return { error: 'Ingresa el correo de tu imprenta' }
  }
  if (!isValidPrintShopEmail(printShopEmail)) {
    return { error: 'Correo de imprenta inválido' }
  }

  return {
    printShopEmail,
    printShopName: normalizePrintShopName(body.printShopName),
    printShopPhone: normalizePrintShopPhone(body.printShopPhone),
  }
}