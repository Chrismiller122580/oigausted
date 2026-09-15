'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

type Props = {
  gigId: string
  sellerId: string
}

const VIEWED_KEY = (gigId: string) => `oiga_gig_viewed_${gigId}`
const VIEW_DEBOUNCE_MS = 30 * 60 * 1000

/**
 * Records a public gig page view for anyone, and a buyer-reminder visit
 * when the viewer is logged in (not the seller).
 */
export default function GigViewTracker({ gigId, sellerId }: Props) {
  const { data: session, status } = useSession()
  const sentForGig = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!gigId) return
    if (session?.user?.id && session.user.id === sellerId) return
    if (sentForGig.current === gigId) return

    try {
      const last = Number(window.sessionStorage.getItem(VIEWED_KEY(gigId)) || '0')
      if (last && Date.now() - last < VIEW_DEBOUNCE_MS) {
        sentForGig.current = gigId
        return
      }
    } catch {
      /* private mode */
    }

    sentForGig.current = gigId
    const controller = new AbortController()
    void fetch(`/api/gigs/${encodeURIComponent(gigId)}/view`, {
      method: 'POST',
      signal: controller.signal,
      keepalive: true,
    })
      .then(() => {
        try {
          window.sessionStorage.setItem(VIEWED_KEY(gigId), String(Date.now()))
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* non-blocking */
      })

    return () => controller.abort()
  }, [status, session?.user?.id, gigId, sellerId])

  return null
}
