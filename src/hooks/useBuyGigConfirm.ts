'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { getAuthCallbackUrl } from '@/lib/getAuthCallbackUrl'

export type BuyGigTarget = {
  gigId: string
  title: string
  price: number
  isActive?: boolean
  sellerId?: string
}

export function useBuyGigConfirm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [pending, setPending] = useState<BuyGigTarget | null>(null)
  const [open, setOpen] = useState(false)

  const requestBuy = useCallback(
    (gig: BuyGigTarget) => {
      if (gig.isActive === false) {
        toast.error('Este servicio está pausado y no se puede comprar.')
        return
      }
      if (gig.sellerId && session?.user?.id === gig.sellerId) {
        toast.error('No puedes comprar tu propio servicio')
        return
      }
      if (!session?.user) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(getAuthCallbackUrl(`/gigs/${gig.gigId}`))}`
        )
        return
      }
      setPending(gig)
      setOpen(true)
    },
    [router, session]
  )

  const confirm = useCallback(() => {
    if (!pending) return
    setOpen(false)
    router.push(`/checkout/${pending.gigId}?confirmed=1`)
    setPending(null)
  }, [pending, router])

  const cancel = useCallback(() => {
    setOpen(false)
    setPending(null)
  }, [])

  return { open, pending, requestBuy, confirm, cancel }
}