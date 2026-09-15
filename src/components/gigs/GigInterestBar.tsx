'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Eye, Heart, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function formatInterestCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0'
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')} mil`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')} M`
}

type Interest = {
  viewCount: number
  likeCount: number
  liked: boolean
}

export function GigInterestStats({
  viewCount = 0,
  likeCount = 0,
  className,
}: {
  viewCount?: number
  likeCount?: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3 text-xs text-muted-foreground', className)}>
      <span className="inline-flex items-center gap-1" title="Personas a las que les gusta esta idea">
        <Heart className="h-3.5 w-3.5 text-rose-500" aria-hidden />
        <span className="tabular-nums font-medium text-foreground">{formatInterestCount(likeCount)}</span>
        <span className="hidden sm:inline">les gusta</span>
      </span>
      <span className="inline-flex items-center gap-1" title="Veces que se ha visto este gig">
        <Eye className="h-3.5 w-3.5 text-sky-600" aria-hidden />
        <span className="tabular-nums font-medium text-foreground">{formatInterestCount(viewCount)}</span>
        <span className="hidden sm:inline">vistas</span>
      </span>
    </div>
  )
}

export default function GigInterestBar({
  gigId,
  gigTitle,
  sellerId,
  viewCount = 0,
  likeCount = 0,
}: {
  gigId: string
  gigTitle: string
  sellerId: string
  viewCount?: number
  likeCount?: number
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const userId = session?.user?.id
  const isOwnGig = Boolean(userId && userId === sellerId)

  const [interest, setInterest] = useState<Interest>({
    viewCount,
    likeCount,
    liked: false,
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setInterest((prev) => ({ ...prev, viewCount, likeCount }))
  }, [viewCount, likeCount])

  useEffect(() => {
    if (status === 'loading') return
    let cancelled = false
    void fetch(`/api/gigs/${encodeURIComponent(gigId)}/like`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setInterest({
          viewCount: typeof data.viewCount === 'number' ? data.viewCount : viewCount,
          likeCount: typeof data.likeCount === 'number' ? data.likeCount : likeCount,
          liked: Boolean(data.liked),
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [gigId, status, viewCount, likeCount])

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/gigs/${gigId}`
      : `https://oigagig.com/gigs/${gigId}`

  const handleShare = async () => {
    const text = `${gigTitle} — servicio en OigaGIG`
    try {
      if (navigator.share) {
        await navigator.share({ title: gigTitle, text, url: shareUrl })
        return
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Enlace copiado. Ya puede compartirlo.')
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`,
        '_blank',
        'noopener,noreferrer',
      )
    }
  }

  const handleLike = async () => {
    if (isOwnGig) {
      toast.info('Este es su propio gig')
      return
    }
    if (!userId) {
      toast.info('Inicie sesión para indicar que le gusta esta idea')
      router.push(`/login?callbackUrl=/gigs/${encodeURIComponent(gigId)}`)
      return
    }
    if (busy) return
    setBusy(true)
    const prev = interest
    setInterest({
      ...prev,
      liked: !prev.liked,
      likeCount: Math.max(0, prev.likeCount + (prev.liked ? -1 : 1)),
    })
    try {
      const res = await fetch(`/api/gigs/${encodeURIComponent(gigId)}/like`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setInterest(prev)
        toast.error(data.error || 'No se pudo guardar su opinión')
        return
      }
      setInterest({
        viewCount: typeof data.viewCount === 'number' ? data.viewCount : prev.viewCount,
        likeCount: typeof data.likeCount === 'number' ? data.likeCount : prev.likeCount,
        liked: Boolean(data.liked),
      })
    } catch {
      setInterest(prev)
      toast.error('Error de conexión')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <button
        type="button"
        onClick={() => void handleLike()}
        disabled={busy || isOwnGig}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition',
          interest.liked
            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
            : 'border-border bg-background hover:bg-muted',
        )}
        aria-pressed={interest.liked}
      >
        <Heart
          className={cn('h-4 w-4', interest.liked && 'fill-rose-500 text-rose-500')}
          aria-hidden
        />
        {interest.liked ? 'Le gusta esta idea' : 'Me gusta esta idea'}
        <span className="tabular-nums text-muted-foreground">
          {formatInterestCount(interest.likeCount)}
        </span>
      </button>

      <button
        type="button"
        onClick={() => void handleShare()}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium hover:bg-muted transition"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        Compartir
      </button>

      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground ml-1">
        <Eye className="h-4 w-4 text-sky-600" aria-hidden />
        <span className="tabular-nums font-medium text-foreground">
          {formatInterestCount(interest.viewCount)}
        </span>
        vistas
      </span>
    </div>
  )
}
