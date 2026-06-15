'use client'

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { getAnalyticsConsent } from '@/lib/analytics-consent'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function ConsentedGoogleAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => {
      setEnabled(getAnalyticsConsent() === 'accepted' && !!GA_MEASUREMENT_ID)
    }

    sync()
    window.addEventListener('analytics-consent-changed', sync)
    return () => window.removeEventListener('analytics-consent-changed', sync)
  }, [])

  if (!enabled || !GA_MEASUREMENT_ID) return null

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
}