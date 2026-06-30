'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Landing target for oigagig://app/auth/mobile-callback deep links.
 * Full session handoff from the system browser is wired at release time.
 */
export default function MobileAuthCallbackClient() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') || '/'
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'
    window.location.replace(safeNext)
  }, [searchParams])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Volviendo a OigaGIG…</h1>
        <p className="text-sm text-muted-foreground">
          Si no avanzas automáticamente, vuelve a la app o continúa en el navegador.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </div>
  )
}