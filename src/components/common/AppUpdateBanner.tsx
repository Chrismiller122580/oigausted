'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SEEN_KEY = 'oigagig-app-version'
const DISMISS_KEY = 'oigagig-update-dismissed'
const UPDATE_EVENT = 'oigagig:update-available'

export default function AppUpdateBanner() {
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('/api/app-version', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const version = String(data.version || '')
        if (!version || version === 'dev' || cancelled) return

        const seen = localStorage.getItem(SEEN_KEY)
        if (!seen) {
          localStorage.setItem(SEEN_KEY, version)
          return
        }
        if (seen === version) return
        if (sessionStorage.getItem(DISMISS_KEY) === version) return

        setRemoteVersion(version)
        setVisible(true)
        window.dispatchEvent(new Event(UPDATE_EVENT))
      } catch {
        // ignore offline checks
      }
    }

    check()
    const onFocus = () => { check() }
    window.addEventListener('focus', onFocus)
    const timer = window.setInterval(check, 5 * 60 * 1000)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      window.clearInterval(timer)
    }
  }, [])

  if (!visible || !remoteVersion) return null

  const update = () => {
    localStorage.setItem(SEEN_KEY, remoteVersion)
    const url = new URL(window.location.href)
    url.searchParams.set('v', remoteVersion.slice(0, 8))
    window.location.replace(url.toString())
  }

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, remoteVersion)
    setVisible(false)
  }

  return (
    <div role="dialog" aria-label="Actualizar OigaGIG" className="fixed inset-x-0 bottom-0 z-[210] p-4 safe-area-inset-bottom">
      <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-4 text-slate-900 shadow-xl">
        <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-orange-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Hay una actualización de OigaGIG</p>
          <p className="mt-1 text-xs text-slate-600">Actualice para ver los cambios nuevos, incluido el botón para subir fotos.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={update}>
              Actualizar
            </Button>
            <Button size="sm" variant="outline" onClick={dismiss}>
              Ahora no
            </Button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Cerrar" className="text-slate-500">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
