import crypto from 'crypto'
import { devLog } from '@/lib/utils'

export const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_EVENTS_SECRET

// Startup diagnostics (always run on module load / function cold start)
console.log('[Wompi] Events key loaded?', !!WOMPI_EVENTS_KEY, 'prefix:', (WOMPI_EVENTS_KEY || '').slice(0, 12) + '...')
if (WOMPI_EVENTS_KEY) {
  const eProd = /prod/i.test(WOMPI_EVENTS_KEY)
  console.log('[Wompi] Events key environment hint:', eProd ? 'prod' : 'test/sandbox')
}
if (process.env.NODE_ENV === 'production' && WOMPI_EVENTS_KEY?.includes('test')) {
  console.warn('⚠️  WARNING: Using Wompi SANDBOX EVENTS key in production! Webhook signature verification will fail for live events.')
}

export type WompiEventSignature = {
  checksum?: string
  properties?: string[]
}

export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined
  return path.split('.').reduce((current, key) => {
    if (current == null) return undefined
    return current[key]
  }, obj)
}

export function resolveWompiProperty(body: any, prop: string): string {
  if (!prop) return ''
  // Wompi properties are paths such as "transaction.id", "transaction.amount_in_cents", "timestamp", etc.
  // They are resolved against the event root (body), which has data.transaction and top-level timestamp/signature.
  let val = getNestedValue(body, prop)
  if (val === undefined) {
    // Try under data (common)
    val = getNestedValue(body?.data, prop)
  }
  if (val === undefined && prop.startsWith('transaction.')) {
    // Try relative under data.transaction (when properties use the "transaction.xxx" shorthand)
    val = getNestedValue(body?.data?.transaction, prop.replace(/^transaction\./, ''))
  }
  if (val === undefined && prop === 'timestamp') {
    val = body?.timestamp
  }
  return val == null ? '' : String(val)
}

export function verifyWompiSignature(body: any, receivedSignature: string, customEventsKey?: string): boolean {
  const result = verifyWompiSignatureDetailed(body, receivedSignature, customEventsKey)
  return result.ok
}

export type VerifyResult = {
  ok: boolean
  reason: string
  signedPayload: string
  properties: string[]
  keyPresent: boolean
  keyEnvHint: 'prod' | 'test' | 'missing' | 'unknown'
  receivedNormalized: string
  computedHex: string
  receivedHexLen: number
  computedHexLen: number
}

export function verifyWompiSignatureDetailed(body: any, receivedSignature: string, customEventsKey?: string): VerifyResult {
  const sig = body?.signature || {}
  const properties: string[] = Array.isArray(sig.properties) ? sig.properties : []

  let signedPayload: string
  if (properties.length > 0) {
    signedPayload = properties.map((p: string) => resolveWompiProperty(body, p)).join('')
  } else {
    // Legacy fallback (older guidance / some events): timestamp + full body JSON
    const timestamp = (body?.timestamp || '').toString()
    signedPayload = `${timestamp}${JSON.stringify(body)}`
  }

  const normalizedReceived = (receivedSignature || '').replace(/^sha256=/i, '').trim().toLowerCase()

  const keyToUse = customEventsKey || WOMPI_EVENTS_KEY

  if (!keyToUse) {
    return {
      ok: false,
      reason: 'No events key provided (neither env nor custom test key)',
      signedPayload,
      properties,
      keyPresent: false,
      keyEnvHint: 'missing',
      receivedNormalized: normalizedReceived,
      computedHex: '',
      receivedHexLen: normalizedReceived.length,
      computedHexLen: 0,
    }
  }

  const computedHex = crypto
    .createHmac('sha256', keyToUse)
    .update(signedPayload)
    .digest('hex')

  const keyEnvHint: 'prod' | 'test' | 'unknown' = /prod/i.test(keyToUse)
    ? 'prod'
    : (/test/i.test(keyToUse) ? 'test' : 'unknown')

  if (!normalizedReceived || !computedHex) {
    return {
      ok: false,
      reason: 'Missing received signature or computed signature',
      signedPayload,
      properties,
      keyPresent: true,
      keyEnvHint,
      receivedNormalized: normalizedReceived,
      computedHex,
      receivedHexLen: normalizedReceived.length,
      computedHexLen: computedHex.length,
    }
  }

  // Lengths must match for timingSafeEqual (both should be 64 hex chars)
  if (normalizedReceived.length !== computedHex.length) {
    return {
      ok: false,
      reason: `Hex length mismatch (received ${normalizedReceived.length} vs computed ${computedHex.length})`,
      signedPayload,
      properties,
      keyPresent: true,
      keyEnvHint,
      receivedNormalized: normalizedReceived,
      computedHex,
      receivedHexLen: normalizedReceived.length,
      computedHexLen: computedHex.length,
    }
  }

  try {
    const match = crypto.timingSafeEqual(
      Buffer.from(normalizedReceived, 'hex'),
      Buffer.from(computedHex, 'hex')
    )
    return {
      ok: match,
      reason: match ? 'ok' : 'HMAC mismatch (keys differ or concat/properties produced different string)',
      signedPayload,
      properties,
      keyPresent: true,
      keyEnvHint,
      receivedNormalized: normalizedReceived,
      computedHex,
      receivedHexLen: normalizedReceived.length,
      computedHexLen: computedHex.length,
    }
  } catch (e) {
    devLog('[Wompi] Signature comparison threw (invalid hex data?)', e)
    return {
      ok: false,
      reason: 'Comparison error (invalid hex in received or computed)',
      signedPayload,
      properties,
      keyPresent: true,
      keyEnvHint,
      receivedNormalized: normalizedReceived,
      computedHex,
      receivedHexLen: normalizedReceived.length,
      computedHexLen: computedHex.length,
    }
  }
}

export function getEventsKeyInfo() {
  const key = WOMPI_EVENTS_KEY || ''
  return {
    present: !!key,
    prefix: key ? key.slice(0, 12) + '...' : 'MISSING',
    envHint: key ? (/prod/i.test(key) ? 'prod' : (/test/i.test(key) ? 'test' : 'unknown')) : 'missing',
    isSandboxInProd: !!(process.env.NODE_ENV === 'production' && key?.includes('test')),
  }
}
