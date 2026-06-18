import type { WompiCheckoutConfig, WompiPrepareResponse } from '@/types/wompi'

/** Build the full WidgetCheckout constructor config from a /api/checkout/wompi response. */
export function buildWompiWidgetConfig(config: WompiPrepareResponse): WompiCheckoutConfig {
  const nested = config.checkoutData
  const integrity = config.integrity ?? nested?.signature?.integrity ?? ''

  const redirectUrl = config.redirectUrl || nested?.redirectUrl

  return {
    publicKey: config.publicKey || nested?.publicKey || '',
    amountInCents: config.amountInCents ?? nested?.amountInCents ?? 0,
    currency: config.currency || nested?.currency || 'COP',
    reference: config.reference || nested?.reference || '',
    redirectUrl,
    // Wompi HTML form uses redirect-url; some widget builds accept the kebab alias too.
    ...(redirectUrl ? { 'redirect-url': redirectUrl } : {}),
    customerData: config.customerData || nested?.customerData,
    ...(integrity ? { signature: { integrity } } : {}),
  }
}