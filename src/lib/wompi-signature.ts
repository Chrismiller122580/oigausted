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
  // Optional diagnostics added for timestamp variant support (propertiesValues + timestamp + eventsKey as HMAC key only)
  usedTimestampVariant?: boolean
  altSignedPayloadWithTimestamp?: string
  altComputedHex?: string
}

export function verifyWompiSignatureDetailed(body: any, receivedSignature: string, customEventsKey?: string): VerifyResult {
  const sig = body?.signature || {}
  const properties: string[] = Array.isArray(sig.properties) ? sig.properties : []

  // CORRECT Wompi signature (properties + optional timestamp when relevant)
  // Primary: concatenate (no separators) the values for exactly the properties listed in signature.properties (in listed order).
  // Use resolveWompiProperty (handles "transaction.xxx", top-level timestamp fallback when prop==='timestamp', data nesting).
  // Timestamp is "important" for replay protection (done separately in webhook handler) and is auto-included
  // only when "timestamp" appears in the event's signature.properties list.
  // The eventsKey (Llave para eventos) is the HMAC key; it is NEVER concatenated into the signed payload.
  let signedPayload: string
  let usedTimestampVariant = false
  let altSignedPayloadWithTimestamp = ''

  if (properties.length > 0) {
    const propertiesValues = properties
      .map((prop: string) => resolveWompiProperty(body, prop))
      .join('')

    const timestamp = (body?.timestamp || (body as any)?.data?.timestamp || '').toString()

    // Primary signed payload: strictly the listed property values (matches official docs + examples)
    signedPayload = propertiesValues

    // Diagnostic / compat alt: propertiesValues + timestamp (some implementations/docs interpretations include it)
    // We compute it so the admin tester can report whether the received checksum matched the alt variant.
    // If a real event's checksum matches only the alt (with a correct key), we will accept it (see below).
    if (timestamp) {
      altSignedPayloadWithTimestamp = `${propertiesValues}${timestamp}`
    }

    // If the primary does not look like it would include a timestamp value already (i.e. "timestamp" not listed),
    // we will also try the alt during matching for forward-compat with "properties + timestamp" events.
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

  // Also compute alt (properties + timestamp) HMAC if we have an alt payload
  let altComputedHex = ''
  if (altSignedPayloadWithTimestamp) {
    altComputedHex = crypto
      .createHmac('sha256', keyToUse)
      .update(altSignedPayloadWithTimestamp)
      .digest('hex')
  }

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
    const standardMatch = crypto.timingSafeEqual(
      Buffer.from(normalizedReceived, 'hex'),
      Buffer.from(computedHex, 'hex')
    )

    let match = standardMatch
    let reason = standardMatch ? 'ok' : 'HMAC mismatch (keys differ or concat/properties produced different string)'

    if (!standardMatch && altComputedHex && normalizedReceived.length === altComputedHex.length) {
      const altMatch = crypto.timingSafeEqual(
        Buffer.from(normalizedReceived, 'hex'),
        Buffer.from(altComputedHex, 'hex')
      )
      if (altMatch) {
        match = true
        usedTimestampVariant = true
        signedPayload = altSignedPayloadWithTimestamp // surface the one that worked
        reason = 'ok (matched properties+timestamp variant)'
      }
    }

    const base: VerifyResult = {
      ok: match,
      reason,
      signedPayload,
      properties,
      keyPresent: true,
      keyEnvHint,
      receivedNormalized: normalizedReceived,
      computedHex: usedTimestampVariant ? altComputedHex : computedHex,
      receivedHexLen: normalizedReceived.length,
      computedHexLen: (usedTimestampVariant ? altComputedHex : computedHex).length,
      usedTimestampVariant,
      altSignedPayloadWithTimestamp: altSignedPayloadWithTimestamp || undefined,
      altComputedHex: altComputedHex || undefined,
    }

    return base
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
