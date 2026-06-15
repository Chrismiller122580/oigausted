/** Server-side: allow forcing order Paid without Wompi webhook (local dev / explicit opt-in). */
export function allowDevPaymentSimulate(): boolean {
  if (process.env.ALLOW_DEV_PAYMENT_SIMULATE === 'true') return true
  if (process.env.NODE_ENV === 'development' && process.env.VERCEL !== '1') return true
  return false
}