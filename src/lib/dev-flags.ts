/** Server-side: allow forcing order Paid without Wompi webhook (local dev only). */
export function allowDevPaymentSimulate(): boolean {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') return false
  if (process.env.ALLOW_DEV_PAYMENT_SIMULATE === 'true') return true
  if (process.env.NODE_ENV === 'development') return true
  return false
}