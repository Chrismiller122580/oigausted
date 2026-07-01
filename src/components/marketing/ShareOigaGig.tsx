'use client'

import { MessageCircle, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buildWhatsAppShareUrl, getDefaultShareUrl } from '@/lib/pwa-install'

import { BRAND_NAME } from '@/lib/brand';

type ShareOigaGigProps = {
  siteName?: string
  className?: string
  variant?: 'footer' | 'inline'
}

export function ShareOigaGig({
  siteName = BRAND_NAME,
  className = '',
  variant = 'footer',
}: ShareOigaGigProps) {
  const shareText = `Encuentra servicios locales confiables en Colombia con ${siteName}.`
  const shareUrl = getDefaultShareUrl()

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: siteName,
          text: shareText,
          url: shareUrl,
        })
        return
      }
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      toast.success('Enlace copiado — compártelo donde quieras')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error('No se pudo compartir el enlace')
    }
  }

  const whatsappHref = buildWhatsAppShareUrl(shareText, shareUrl)

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <Button size="sm" variant="outline" asChild>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={handleNativeShare}>
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
        Comparte con amigos
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-sm font-medium hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
        >
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-sm font-medium hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors"
        >
          <Share2 className="h-4 w-4 text-orange-600" />
          Compartir enlace
        </button>
      </div>
    </div>
  )
}