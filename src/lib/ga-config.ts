/** GA4 measurement ID — public client value; env overrides default. */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-9FNTWY76HH'