'use client'

import { useEffect } from 'react'
import { buildNativeDeepLink } from '@/lib/capacitor-native'

type Props = {
  token: string
  nextPath: string
}

/**
 * Runs in the system browser after Google OAuth. Redirects into the native app
 * with a one-time handoff token the WebView exchanges for a session cookie.
 */
export default function MobileHandoffClient({ token, nextPath }: Props) {
  useEffect(() => {
    const params = new URLSearchParams({ token, next: nextPath })
    const deepLink = buildNativeDeepLink(`/auth/mobile-callback?${params.toString()}`)
    window.location.replace(deepLink)
  }, [token, nextPath])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Abriendo OigaGIG…</p>
    </div>
  )
}