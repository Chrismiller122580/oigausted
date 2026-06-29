'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import StartInquiryButton from '@/components/common/StartInquiryButton'
import { getAuthCallbackUrl } from '@/lib/getAuthCallbackUrl'

type Props = {
  gigId: string
  sellerId: string
  isActive: boolean
}

export default function GigDetailActions({ gigId, sellerId, isActive }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const isOwnGig = userId === sellerId

  const handleBuyNow = () => {
    if (!isActive) {
      toast.error('Este servicio está pausado y no se puede comprar.')
      return
    }
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(getAuthCallbackUrl(`/gigs/${gigId}`))}`)
      return
    }
    router.push(`/checkout/${gigId}`)
  }

  if (isOwnGig) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-3xl mb-8 text-center font-medium">
        Este es tu propio gig • No puedes comprarlo
      </div>
    )
  }

  return (
    <div className="space-y-3 mb-8">
      <Button
        onClick={handleBuyNow}
        size="lg"
        className="w-full py-8 text-xl bg-emerald-600 hover:bg-emerald-700 rounded-3xl font-semibold"
        disabled={!isActive}
      >
        {!isActive ? 'Servicio pausado' : 'Comprar ahora'}
      </Button>
      {isActive && (
        <StartInquiryButton
          gigId={gigId}
          fullWidth
          size="lg"
          label="Chatear con vendedor"
          className="py-6 text-lg rounded-3xl"
        />
      )}
    </div>
  )
}