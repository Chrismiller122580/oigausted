'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Share, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { brandButtonClass } from '@/lib/design-tokens'
import {
  canShowPwaInstallPrompt,
  getPwaInstallPlatform,
  markPwaInstallDismissed,
  pwaPromptOffsetClass,
  PWA_INSTALL_ELIGIBLE_EVENT,
  type PwaInstallPlatform,
} from '@/lib/pwa-install'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallPrompt() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<PwaInstallPlatform | null>(null)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  const syncVisibility = useCallback(() => {
    const nextPlatform = getPwaInstallPlatform()
    setPlatform(nextPlatform)
    setVisible(canShowPwaInstallPrompt(pathname))
  }, [pathname])

  useEffect(() => {
    const showIfNeeded = () => syncVisibility()

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(showIfNeeded, { timeout: 2500 })
      return () => window.cancelIdleCallback(id)
    }

    const t = window.setTimeout(showIfNeeded, 1500)
    return () => window.clearTimeout(t)
  }, [syncVisibility])

  useEffect(() => {
    const onEligible = () => syncVisibility()
    window.addEventListener(PWA_INSTALL_ELIGIBLE_EVENT, onEligible)
    return () => window.removeEventListener(PWA_INSTALL_ELIGIBLE_EVENT, onEligible)
  }, [syncVisibility])

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    markPwaInstallDismissed()
    setVisible(false)
  }

  const handleInstall = async () => {
    if (platform === 'android-chrome' && deferredPrompt) {
      setInstalling(true)
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          setVisible(false)
        } else {
          dismiss()
        }
      } catch {
        // User cancelled or browser blocked the prompt
      } finally {
        setInstalling(false)
        setDeferredPrompt(null)
      }
      return
    }

    dismiss()
  }

  if (!visible || !platform) return null

  const role = session?.user?.role
  const offsetClass = pwaPromptOffsetClass(pathname, role)
  const isIos = platform === 'ios'

  return (
    <div
      role="dialog"
      aria-label="Instalar OigaGIG"
      className={`fixed inset-x-0 z-[190] p-4 safe-area-inset-bottom md:hidden ${offsetClass}`}
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card/95 backdrop-blur shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/50">
            <Smartphone className="h-5 w-5 text-orange-700 dark:text-orange-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Instala OigaGIG en tu celular
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {isIos
                    ? 'Acceso rápido, notificaciones y una experiencia como app — sin descargar desde la tienda todavía.'
                    : 'Acceso rápido desde tu pantalla de inicio y notificaciones de pedidos y mensajes.'}
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {isIos ? (
              <ol className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Share className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
                  Toca <strong className="text-foreground">Compartir</strong> en Safari
                </li>
                <li>
                  Elige <strong className="text-foreground">Agregar a pantalla de inicio</strong>
                </li>
              </ol>
            ) : null}

            <div className="mt-4 flex gap-2">
              {!isIos ? (
                <Button
                  size="sm"
                  className={`flex-1 ${brandButtonClass}`}
                  onClick={handleInstall}
                  disabled={installing || !deferredPrompt}
                >
                  {installing ? 'Instalando…' : 'Instalar app'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className={`flex-1 ${brandButtonClass}`}
                  onClick={dismiss}
                >
                  Entendido
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={dismiss}>
                Ahora no
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}