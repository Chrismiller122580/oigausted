'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/analytics-consent'
import {
  canShowCookieConsent,
  hasSeenHomepageWelcome,
  HOMEPAGE_WELCOME_DISMISSED_EVENT,
} from '@/lib/first-visit-banners'
import { brandButtonClass } from '@/lib/design-tokens'

const COOKIE_BANNER_DELAY_MS = 300

export default function CookieConsent() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  const syncVisibility = useCallback(() => {
    setVisible(canShowCookieConsent(pathname))
  }, [pathname])

  useEffect(() => {
    if (pathname === '/' && !hasSeenHomepageWelcome()) {
      setVisible(false)
    }
  }, [pathname])

  useEffect(() => {
    const showIfNeeded = () => syncVisibility()

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(showIfNeeded, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }

    const t = setTimeout(showIfNeeded, 2000)
    return () => clearTimeout(t)
  }, [syncVisibility])

  useEffect(() => {
    const onWelcomeDismissed = () => {
      window.setTimeout(syncVisibility, COOKIE_BANNER_DELAY_MS)
    }

    window.addEventListener(HOMEPAGE_WELCOME_DISMISSED_EVENT, onWelcomeDismissed)
    return () => window.removeEventListener(HOMEPAGE_WELCOME_DISMISSED_EVENT, onWelcomeDismissed)
  }, [syncVisibility])

  if (!visible) return null

  const choose = (value: 'accepted' | 'essential') => {
    setAnalyticsConsent(value)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed bottom-0 inset-x-0 z-[200] p-4 pb-safe md:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 backdrop-blur shadow-xl p-4 md:p-5">
        <p className="text-sm text-foreground leading-relaxed">
          Usamos cookies esenciales para tu sesión y preferencias, y — si aceptas — Google Analytics
          para entender cómo se usa el sitio y mejorar campañas. También medimos visitas de forma
          anónima con Vercel Analytics (sin cookies de marketing).
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Más información en nuestra{' '}
          <Link href="/privacy" className="text-orange-700 hover:text-orange-800 hover:underline">
            política de privacidad
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" size="sm" onClick={() => choose('essential')}>
            Solo esenciales
          </Button>
          <Button size="sm" className={brandButtonClass} onClick={() => choose('accepted')}>
            Aceptar analíticas
          </Button>
        </div>
      </div>
    </div>
  )
}