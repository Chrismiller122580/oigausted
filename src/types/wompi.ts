export interface WompiTransactionAmount {
  in_cents: number
  currency?: string
}

export interface WompiTransaction {
  id: string
  status: string
  amount_in_cents?: number
  amount?: WompiTransactionAmount
  reference?: string
  customer_email?: string
  payment_method_type?: string
  status_message?: string
  currency?: string
  created_at?: string
  finalized_at?: string
  redirect_url?: string
}

export interface WompiWebhookEventData {
  transaction?: WompiTransaction
}

export interface WompiWebhookEvent {
  event: string
  data?: WompiWebhookEventData
  sent_at?: string
  timestamp?: number
  signature?: { checksum?: string; properties?: string[] }
  environment?: string
}

export interface WompiPrepareDebug {
  reference?: string
  integritySignature?: string
  amountInCents?: number
  publicKey?: string
  redirectUrl?: string
  error?: string
  raw?: unknown
}

export interface WompiCheckoutConfig {
  currency: string
  amountInCents: number
  reference: string
  publicKey: string
  redirectUrl?: string
  signature?: { integrity: string }
  customerData?: { email?: string; fullName?: string }
}

/** WidgetCheckout constructor config (camelCase + optional Wompi kebab-case aliases). */
export type WompiWidgetConfig = WompiCheckoutConfig & {
  'redirect-url'?: string
}

/** POST /api/checkout/wompi response */
export interface WompiPrepareResponse {
  reference?: string
  amountInCents?: number
  publicKey?: string
  integrity?: string
  currency?: string
  redirectUrl?: string
  customerData?: { email?: string; fullName?: string }
  hasIntegritySignature?: boolean
  debug?: WompiPrepareDebug
  checkoutData?: WompiCheckoutConfig
  keyMismatchWarning?: string
  error?: string
  success?: boolean
}

export interface WompiWidgetResult {
  error?: string | Record<string, unknown>
  transaction?: WompiTransaction & {
    error?: string
    status_message?: string
  }
  id?: string
  transactionId?: string
}

export interface WompiCheckWompiSummary {
  id?: string
  status?: string
  amount_in_cents?: number
  currency?: string
  error?: string
  reference?: string
  wompiError?: string
  wompiSummary?: WompiCheckWompiSummary
  wompiBase?: string
  queriedBy?: string
  authType?: string
  details?: string | Record<string, unknown>
  transactionId?: string
  wompiTransactionId?: string
}

/** In-page Wompi debugger state (orders + checkout pages) */
export interface WompiClientDebugState extends WompiPrepareDebug {
  success?: boolean
  signature?: string
  integrity?: string
  checkoutData?: {
    reference?: string
    amountInCents?: number
    signature?: { integrity?: string }
  }
  keyMismatchWarning?: string
  signedStringPreview?: string
  lastRecompute?: {
    matchesPrevious?: boolean
    note?: string
    previousSigPrefix?: string
    newSigPrefix?: string | null
  }
  lastWidgetResultError?: string
  lastWidgetError?: string
  lastWidgetResult?: WompiWidgetResult
  lastCheckWompi?: WompiCheckWompiSummary
}

export interface WompiTestSummary {
  publicKeyPrefix?: string
  integrityKeyPrefix?: string
  eventsKeyPrefix?: string
  privateKeyPrefix?: string
  environments?: Record<string, string>
  integrityPubMismatch?: boolean
  sampleSignature?: string
  sampleSignatureNote?: string
  sampleEventsSignature?: string
  sampleEventsSignatureNote?: string
  query?: {
    ok?: boolean
    status?: string | number
    usedPrivate?: boolean
    error?: string
  }
  eventVerification?: {
    attempted?: boolean
    matches?: boolean
    signedPayload?: string
    reason?: string
  }
  replayResult?: {
    attempted?: boolean
    success?: boolean
    action?: string
    orderId?: string
    status?: string
  }
  recommendations?: string[]
  success?: boolean
  error?: string
}