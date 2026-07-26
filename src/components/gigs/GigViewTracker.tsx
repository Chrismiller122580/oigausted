'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

type Props = {
  gigId: string
  sellerId: string
}

/**
 * Records a gig page view for logged-in buyers (not the seller).
 * Server may send a multi-visit reminder after the 2nd distinct visit.
 */
export default function GigViewTracker({ gigId, sellerId }: Props) {
  const { data: session, status } = useSession()
  const sentForGig = useRef<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    const userId = session?.user?.id
    if (!userId || userId === sellerId) return
    if (!gigId) return
    // Once per mount / gig (server still debounces within 30 min)
    if (sentForGig.current === gigId) return
    sentForGig.current = gigId

    const controller = new AbortController()
    void fetch(`/api/gigs/${encodeURIComponent(gigId)}/view`, {
      method: 'POST',
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      /* non-blocking */
    })

    return () => controller.abort()
  }, [status, session?.user?.id, gigId, sellerId])

  return null
}
