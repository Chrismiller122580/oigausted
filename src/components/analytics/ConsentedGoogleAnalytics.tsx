'use client'

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { getAnalyticsConsent } from '@/lib/analytics-consent'
import { GA_MEASUREMENT_ID } from '@/lib/ga-config'

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