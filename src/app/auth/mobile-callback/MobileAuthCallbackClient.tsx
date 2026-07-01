'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { closeInAppBrowser, isCapacitorNative } from '@/lib/capacitor-native'

function sanitizeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

/**
 * Landing target for oigagig://app/auth/mobile-callback deep links.
 * Exchanges a one-time handoff token (from /auth/mobile-handoff) for a WebView session.
 */
export default function MobileAuthCallbackClient() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const next = sanitizeNextPath(searchParams.get('next'))
    const token = searchParams.get('token')

    const finish = async () => {
      if (isCapacitorNative()) {
        await closeInAppBrowser()
      }

      if (!token) {
        window.location.replace(next)
        return
      }

      try {
        const result = await signIn('mobile-handoff', {
          token,
          redirect: false,
        })

        if (result?.ok) {
          await fetch('/api/auth/record-login', { method: 'POST' }).catch(() => {})
          window.location.replace(next)
          return
        }

        setError('No pudimos completar el inicio de sesión. Intenta de nuevo.')
      } catch {
        setError('No pudimos completar el inicio de sesión. Intenta de nuevo.')
      }
    }

    void finish()
  }, [searchParams])

  if (!error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Completando inicio de sesión…</p>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Inicio de sesión incompleto</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/login">Volver a iniciar sesión</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}